#!/usr/bin/env python3
import json
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "signal_board.db"


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(value):
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-") or "default-org"


def ensure_org_user_membership(conn, org_slug, org_name, email):
    org = conn.execute("SELECT id FROM organizations WHERE slug = ?", (org_slug,)).fetchone()
    if not org:
        org_id = str(uuid.uuid4())
        conn.execute("INSERT INTO organizations (id, slug, name) VALUES (?, ?, ?)", (org_id, org_slug, org_name))
    else:
        org_id = org[0]

    user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        user_id = str(uuid.uuid4())
        conn.execute("INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)", (user_id, email, email))
    else:
        user_id = user[0]

    membership = conn.execute("SELECT id FROM memberships WHERE organization_id = ? AND user_id = ?", (org_id, user_id)).fetchone()
    if not membership:
        conn.execute(
            "INSERT INTO memberships (id, organization_id, user_id, role) VALUES (?, ?, ?, 'owner')",
            (str(uuid.uuid4()), org_id, user_id),
        )
    return org_id


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 api/import_local_export.py <json-file> [org-slug] [org-name] [user-email]")
        sys.exit(1)

    json_file = Path(sys.argv[1])
    org_slug = slugify(sys.argv[2]) if len(sys.argv) > 2 else "community-org"
    org_name = sys.argv[3] if len(sys.argv) > 3 else "Community Org"
    user_email = sys.argv[4] if len(sys.argv) > 4 else "importer@local.dev"

    payload = json.loads(json_file.read_text(encoding="utf-8"))
    items = payload.get("items", []) if isinstance(payload, dict) else []
    if not isinstance(items, list):
        raise ValueError("Expected an array at payload.items")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
    org_id = ensure_org_user_membership(conn, org_slug, org_name, user_email)

    inserted = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        source = str(item.get("source", "")).strip()
        if not title or not source:
            continue
        conn.execute(
            """
            INSERT INTO signals (id, organization_id, title, source, category, urgency, relevance, confidence, owner, external_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                org_id,
                title,
                source,
                str(item.get("category", "Opportunity")),
                max(1, min(5, int(item.get("urgency", 3)))),
                max(1, min(5, int(item.get("relevance", 3)))),
                max(1, min(5, int(item.get("confidence", 3)))),
                str(item.get("owner", "Unassigned")),
                item.get("externalId"),
                item.get("createdAt") or utc_now_iso(),
                utc_now_iso(),
            ),
        )
        inserted += 1

    conn.commit()
    conn.close()
    print(f"Imported {inserted} signal(s) into org '{org_slug}'")


if __name__ == "__main__":
    main()
