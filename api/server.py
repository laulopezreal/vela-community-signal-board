#!/usr/bin/env python3
import json
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("SIGNAL_BOARD_DB", ROOT / "signal_board.db"))
SCHEMA_PATH = ROOT / "schema.sql"


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    with SCHEMA_PATH.open("r", encoding="utf-8") as fh:
        conn.executescript(fh.read())
    conn.commit()
    conn.close()


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def slugify(value):
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-") or "default-org"


def signal_score(row):
    return row["urgency"] * 2 + row["relevance"] + row["confidence"]


class ApiHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.end_headers()

    def read_json(self):
        size = int(self.headers.get("Content-Length", "0"))
        if size <= 0:
            return {}
        return json.loads(self.rfile.read(size).decode("utf-8"))

    def auth_context(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1].strip()
        conn = get_conn()
        row = conn.execute(
            """
            SELECT s.*, u.email, u.display_name, o.slug AS organization_slug, o.name AS organization_name
            FROM auth_sessions s
            JOIN users u ON u.id = s.user_id
            JOIN organizations o ON o.id = s.organization_id
            WHERE s.access_token = ? AND datetime(s.expires_at) > datetime('now')
            """,
            (token,),
        ).fetchone()
        conn.close()
        return row

    def require_auth(self):
        ctx = self.auth_context()
        if not ctx:
            self.send_json(401, {"error": "Unauthorized. Provide Bearer token."})
            return None
        return ctx

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/auth/request-magic-link":
            return self.handle_request_magic_link()
        if parsed.path == "/auth/verify-magic-link":
            return self.handle_verify_magic_link()
        if parsed.path == "/signals":
            return self.handle_create_signal()
        if parsed.path == "/digests/generate":
            return self.handle_generate_digest()
        if parsed.path.startswith("/signals/") and parsed.path.endswith("/actions"):
            return self.handle_create_signal_action(parsed.path)
        self.send_json(404, {"error": "Not found"})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            return self.send_json(200, {"status": "ok", "db": str(DB_PATH)})
        if parsed.path == "/signals":
            return self.handle_list_signals(parsed)
        if parsed.path.startswith("/signals/") and parsed.path.endswith("/actions"):
            return self.handle_list_signal_actions(parsed.path)
        self.send_json(404, {"error": "Not found"})

    def do_PATCH(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/signals/"):
            return self.handle_update_signal(parsed.path)
        self.send_json(404, {"error": "Not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/signals/"):
            return self.handle_delete_signal(parsed.path)
        self.send_json(404, {"error": "Not found"})

    def handle_request_magic_link(self):
        body = self.read_json()
        email = str(body.get("email", "")).strip().lower()
        organization_name = str(body.get("organizationName", "Community Org")).strip() or "Community Org"
        if not email or "@" not in email:
            return self.send_json(400, {"error": "Valid email is required"})

        organization_slug = slugify(body.get("organizationSlug") or organization_name)
        conn = get_conn()

        org = conn.execute("SELECT id, slug FROM organizations WHERE slug = ?", (organization_slug,)).fetchone()
        if not org:
            org_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO organizations (id, slug, name) VALUES (?, ?, ?)",
                (org_id, organization_slug, organization_name),
            )
        token = str(uuid.uuid4())
        magic_id = str(uuid.uuid4())
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        conn.execute(
            "INSERT INTO magic_links (id, email, organization_slug, token, expires_at) VALUES (?, ?, ?, ?, ?)",
            (magic_id, email, organization_slug, token, expires_at),
        )
        conn.commit()
        conn.close()

        self.send_json(
            200,
            {
                "message": "Magic link issued (dev mode: token returned directly).",
                "token": token,
                "organizationSlug": organization_slug,
            },
        )

    def handle_verify_magic_link(self):
        body = self.read_json()
        token = str(body.get("token", "")).strip()
        if not token:
            return self.send_json(400, {"error": "token is required"})

        conn = get_conn()
        row = conn.execute(
            """
            SELECT * FROM magic_links
            WHERE token = ?
              AND consumed_at IS NULL
              AND datetime(expires_at) > datetime('now')
            """,
            (token,),
        ).fetchone()
        if not row:
            conn.close()
            return self.send_json(401, {"error": "Invalid or expired token"})

        user = conn.execute("SELECT id, email FROM users WHERE email = ?", (row["email"],)).fetchone()
        if not user:
            user_id = str(uuid.uuid4())
            conn.execute("INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)", (user_id, row["email"], row["email"]))
        else:
            user_id = user["id"]

        org = conn.execute("SELECT id, slug FROM organizations WHERE slug = ?", (row["organization_slug"],)).fetchone()
        if not org:
            conn.close()
            return self.send_json(400, {"error": "Organization no longer exists"})

        membership = conn.execute(
            "SELECT id FROM memberships WHERE organization_id = ? AND user_id = ?",
            (org["id"], user_id),
        ).fetchone()
        if not membership:
            conn.execute(
                "INSERT INTO memberships (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)",
                (str(uuid.uuid4()), org["id"], user_id, "owner"),
            )

        access_token = str(uuid.uuid4())
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        conn.execute(
            "INSERT INTO auth_sessions (id, user_id, organization_id, access_token, expires_at) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), user_id, org["id"], access_token, expires_at),
        )
        conn.execute("UPDATE magic_links SET consumed_at = ? WHERE id = ?", (utc_now_iso(), row["id"]))
        conn.commit()
        conn.close()

        self.send_json(
            200,
            {
                "accessToken": access_token,
                "organizationSlug": org["slug"],
                "user": {"id": user_id, "email": row["email"]},
            },
        )

    def handle_list_signals(self, parsed):
        ctx = self.require_auth()
        if not ctx:
            return
        query = parse_qs(parsed.query)
        category = (query.get("category") or [""])[0]
        min_urgency = int((query.get("minUrgency") or [0])[0] or 0)
        search = ((query.get("search") or [""])[0] or "").strip().lower()
        sort = ((query.get("sort") or ["score_desc"])[0] or "score_desc").strip()

        conn = get_conn()
        rows = conn.execute(
            "SELECT * FROM signals WHERE organization_id = ? ORDER BY datetime(created_at) DESC",
            (ctx["organization_id"],),
        ).fetchall()
        conn.close()

        items = []
        for row in rows:
            item = dict(row)
            item["score"] = signal_score(row)
            if category and category != "all" and item["category"] != category:
                continue
            if min_urgency and int(item["urgency"]) < min_urgency:
                continue
            if search and search not in item["title"].lower() and search not in item["source"].lower():
                continue
            items.append(item)

        if sort == "created_desc":
            items.sort(key=lambda x: x["created_at"], reverse=True)
        elif sort == "created_asc":
            items.sort(key=lambda x: x["created_at"])
        else:
            items.sort(key=lambda x: (x["score"], x["created_at"]), reverse=True)

        self.send_json(200, {"items": items})

    def handle_create_signal(self):
        ctx = self.require_auth()
        if not ctx:
            return
        body = self.read_json()
        title = str(body.get("title", "")).strip()
        source = str(body.get("source", "")).strip()
        if not title or not source:
            return self.send_json(400, {"error": "title and source are required"})

        row = {
            "id": str(uuid.uuid4()),
            "organization_id": ctx["organization_id"],
            "title": title,
            "source": source,
            "category": str(body.get("category", "Opportunity")),
            "urgency": max(1, min(5, int(body.get("urgency", 3)))),
            "relevance": max(1, min(5, int(body.get("relevance", 3)))),
            "confidence": max(1, min(5, int(body.get("confidence", 3)))),
            "owner": str(body.get("owner") or "Unassigned"),
            "external_id": body.get("externalId"),
            "created_at": str(body.get("createdAt") or utc_now_iso()),
            "updated_at": utc_now_iso(),
        }
        conn = get_conn()
        conn.execute(
            """
            INSERT INTO signals (id, organization_id, title, source, category, urgency, relevance, confidence, owner, external_id, created_at, updated_at)
            VALUES (:id, :organization_id, :title, :source, :category, :urgency, :relevance, :confidence, :owner, :external_id, :created_at, :updated_at)
            """,
            row,
        )
        conn.commit()
        conn.close()
        self.send_json(201, {"item": {**row, "score": row["urgency"] * 2 + row["relevance"] + row["confidence"]}})

    def handle_update_signal(self, path):
        ctx = self.require_auth()
        if not ctx:
            return
        signal_id = path.split("/")[2]
        body = self.read_json()
        allowed = ["title", "source", "category", "urgency", "relevance", "confidence", "owner"]
        updates = {k: body[k] for k in allowed if k in body}
        if not updates:
            return self.send_json(400, {"error": "No updates provided"})

        sets, params = [], []
        for key, value in updates.items():
            sets.append(f"{key} = ?")
            params.append(value)
        sets.append("updated_at = ?")
        params.append(utc_now_iso())
        params.extend([signal_id, ctx["organization_id"]])

        conn = get_conn()
        cur = conn.execute(
            f"UPDATE signals SET {', '.join(sets)} WHERE id = ? AND organization_id = ?",
            tuple(params),
        )
        conn.commit()
        conn.close()
        if cur.rowcount == 0:
            return self.send_json(404, {"error": "Signal not found"})
        self.send_json(200, {"ok": True})

    def handle_delete_signal(self, path):
        ctx = self.require_auth()
        if not ctx:
            return
        signal_id = path.split("/")[2]
        conn = get_conn()
        cur = conn.execute("DELETE FROM signals WHERE id = ? AND organization_id = ?", (signal_id, ctx["organization_id"]))
        conn.commit()
        conn.close()
        if cur.rowcount == 0:
            return self.send_json(404, {"error": "Signal not found"})
        self.send_json(200, {"ok": True})

    def handle_create_signal_action(self, path):
        ctx = self.require_auth()
        if not ctx:
            return
        signal_id = path.split("/")[2]
        body = self.read_json()
        action_text = str(body.get("actionText", "")).strip()
        if not action_text:
            return self.send_json(400, {"error": "actionText is required"})
        conn = get_conn()
        signal = conn.execute("SELECT id FROM signals WHERE id = ? AND organization_id = ?", (signal_id, ctx["organization_id"])).fetchone()
        if not signal:
            conn.close()
            return self.send_json(404, {"error": "Signal not found"})
        action = {
            "id": str(uuid.uuid4()),
            "organization_id": ctx["organization_id"],
            "signal_id": signal_id,
            "action_text": action_text,
            "status": str(body.get("status") or "open"),
            "created_by_user_id": ctx["user_id"],
        }
        conn.execute(
            "INSERT INTO signal_actions (id, organization_id, signal_id, action_text, status, created_by_user_id) VALUES (:id,:organization_id,:signal_id,:action_text,:status,:created_by_user_id)",
            action,
        )
        conn.commit()
        conn.close()
        self.send_json(201, {"action": action})

    def handle_list_signal_actions(self, path):
        ctx = self.require_auth()
        if not ctx:
            return
        signal_id = path.split("/")[2]
        conn = get_conn()
        rows = conn.execute(
            "SELECT id, signal_id, action_text, status, created_at FROM signal_actions WHERE organization_id = ? AND signal_id = ? ORDER BY datetime(created_at) DESC",
            (ctx["organization_id"], signal_id),
        ).fetchall()
        conn.close()
        self.send_json(200, {"items": [dict(x) for x in rows]})

    def handle_generate_digest(self):
        ctx = self.require_auth()
        if not ctx:
            return
        body = self.read_json()
        top_n = max(1, min(50, int(body.get("topN", 10))))
        conn = get_conn()
        rows = conn.execute("SELECT * FROM signals WHERE organization_id = ?", (ctx["organization_id"],)).fetchall()
        items = [dict(r) for r in rows]
        items.sort(key=lambda x: (x["urgency"] * 2 + x["relevance"] + x["confidence"], x["created_at"]), reverse=True)
        selected = items[:top_n]

        date = datetime.now(timezone.utc).date().isoformat()
        lines = [f"# Community Signal Digest ({date})", "", "Scoring formula: urgency * 2 + relevance + confidence", ""]
        for idx, it in enumerate(selected, start=1):
            score = it["urgency"] * 2 + it["relevance"] + it["confidence"]
            lines.append(
                f"{idx}. **{it['title']}** ({it['category']})\\n   - Source: {it['source']}\\n   - Owner: {it['owner']}\\n   - Urgency: {it['urgency']} | Relevance: {it['relevance']} | Confidence: {it['confidence']} | Score: {score}"
            )

        payload = "\n".join(lines)
        digest_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO digest_exports (id, organization_id, generated_by_user_id, format, payload) VALUES (?, ?, ?, 'markdown', ?)",
            (digest_id, ctx["organization_id"], ctx["user_id"], payload),
        )
        conn.commit()
        conn.close()
        self.send_json(200, {"id": digest_id, "markdown": payload, "count": len(selected)})


def main():
    ensure_db()
    port = int(os.environ.get("API_PORT", "8787"))
    host = os.environ.get("API_HOST", "0.0.0.0")
    server = ThreadingHTTPServer((host, port), ApiHandler)
    print(f"API listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
