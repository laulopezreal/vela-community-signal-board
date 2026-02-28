# Real Value Before/After (Submission Evidence)

## User / Job-to-be-done
- **User:** founder/operator running a small builder community.
- **Job-to-be-done:** turn scattered external updates (Discord/X/etc) into a single prioritized action queue fast enough to act same day.

## Baseline (before Vela real-input bridge)
- Signals are manually scanned in multiple channels.
- Prioritization is ad hoc and hard to justify.
- No reproducible ranking snapshot from a real exported input.
- Typical triage output: unranked notes and missed expiry-sensitive opportunities.

## After (with Vela + local ingestion path)
- A real exported JSON file is ingested through an explicit adapter contract.
- Input is normalized, scored deterministically, and sorted into ranked queue output.
- Queue snapshot is generated as a shareable markdown artifact for verification.

## Measurable delta
- **Input-to-ranked-output time:** from manual/variable to one command (`node ops/run_local_ingestion.js`).
- **Reproducibility:** from no deterministic replay to deterministic replay with fixed formula + tie-break rule.
- **Evidence quality:** from narrative-only claim to concrete artifacts (input JSON + ranked snapshot + run command).

## Proof artifact pointers
- Adapter contract: [ops/real-input-adapter-contract.md](../../ops/real-input-adapter-contract.md)
- Real exported sample input: [docs/artifacts/sample-exported-signals.json](./sample-exported-signals.json)
- Ranked queue output snapshot: [docs/artifacts/real-input-ranked-queue-snapshot.md](./real-input-ranked-queue-snapshot.md)
- Local command used: `node ops/run_local_ingestion.js`
