# Canonical Evidence Manifest

version: v1
dataset_date: 2026-02-27

sample-daily-brief.md | lines=30 | sha256=44d4d9ad7cb7681f409eb29be43aca1b52e94c5e80dc7f395982d15b754e6da9
sample-digest.md | lines=27 | sha256=7441c02fcda270697b335d09c0f0b91c4079b6e67125fce7b41419b8bc2cc3ca

line_count_method: split("\n") semantic line count (trailing newline included)
independent_cli_note: `wc -l` may show one less line when files do not end with a trailing newline.

status: PASS (checksums and semantic line counts match expected canonical manifest)