#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <receipt-path>" >&2
  exit 2
fi

receipt_path="$1"

python3 - "$receipt_path" <<'PY'
import hashlib
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding='utf-8')

marker = "\n\nReceipt SHA-256 (body): "
if marker not in text:
    print(f"FAIL: missing receipt hash marker in {path}")
    sys.exit(1)

body, tail = text.split(marker, 1)
line = tail.splitlines()[0].strip()
if not re.fullmatch(r"[0-9a-f]{64}", line):
    print(f"FAIL: invalid embedded hash format in {path}: {line!r}")
    sys.exit(1)

actual = hashlib.sha256(body.encode("utf-8")).hexdigest()
if actual == line:
    print(f"PASS: receipt body hash verified ({actual})")
    sys.exit(0)

print(f"FAIL: receipt body hash mismatch (embedded={line}, recomputed={actual})")
sys.exit(1)
PY
