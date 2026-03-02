# Phase1 Data Contracts

## Versions
- Inbound event schema: `signal.schema.v1.json`
- Dashboard read model: `read-model.contract.v1.json`

## Rollback switch
Use `CONTRACT_VERSION=v1` to keep previous stable contract during incident rollback.

## Taxonomy (DLQ reasons)
- `INVALID_EVENT_OBJECT`
- `MISSING_ID`
- `MISSING_CONTENT`
- `INVALID_CREATED_AT`
- `INVALID_PROVIDER`
- `INVALID_EVENT_TYPE`
- `INVALID_SOURCE`
- `FORCED_TRANSFORM_FAILURE`

## Validation report
Daily report path: `data/phase1/contract-validation-report.json`
Contains totals, pass/fail, duplicates, and failure distribution by source and reason.
