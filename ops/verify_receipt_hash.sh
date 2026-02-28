#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <receipt-markdown-path>" >&2
  exit 2
fi

receipt_path="$1"
if [[ ! -f "$receipt_path" ]]; then
  echo "ERROR: file not found: $receipt_path" >&2
  exit 2
fi

declared_hash="$(sed -nE 's/^Receipt SHA-256 \(body\): ([0-9a-f]{64})$/\1/p' "$receipt_path" | tail -n 1)"
if [[ -z "$declared_hash" ]]; then
  echo "ERROR: declared receipt hash line not found in $receipt_path" >&2
  exit 1
fi

body_hash="$(python3 - "$receipt_path" <<'PY'
from pathlib import Path
import hashlib,sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
marker='\nReceipt SHA-256 (body): '
if marker not in s:
    print('')
    raise SystemExit(0)
body=s.split(marker,1)[0].rstrip('\n')+'\n'
print(hashlib.sha256(body.encode('utf-8')).hexdigest())
PY
)"

if [[ -z "$body_hash" ]]; then
  echo "ERROR: failed to compute body hash" >&2
  exit 1
fi

if [[ "$declared_hash" == "$body_hash" ]]; then
  echo "PASS: receipt hash matches"
  echo "file: $receipt_path"
  echo "sha256: $body_hash"
  exit 0
fi

echo "FAIL: receipt hash mismatch" >&2
echo "file: $receipt_path" >&2
echo "declared: $declared_hash" >&2
echo "computed: $body_hash" >&2
exit 1
