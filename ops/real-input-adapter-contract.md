# Real Input Adapter Contract (Minimal, No Secrets)

Purpose: define a stable bridge from real exported community signals (Discord/X/etc) into Vela's ranked queue model without requiring live API credentials.

## Input envelope

Each adapter must output JSON with this top-level shape:

```json
{
  "adapter": "discord-export|x-export|generic-json",
  "exportedAt": "2026-02-28T15:00:00Z",
  "items": [
    {
      "externalId": "discord:msg:123",
      "title": "Grant call closes tonight for community tooling",
      "source": "Discord #grants",
      "category": "Opportunity",
      "urgency": 5,
      "relevance": 5,
      "confidence": 4,
      "owner": "Lau",
      "createdAt": "2026-02-28T13:20:00Z"
    }
  ]
}
```

## Required fields per item

- `externalId` (string): immutable source identifier.
- `title` (string): concise signal summary.
- `source` (string): human-verifiable origin label.
- `category` (string): must map to Vela categories (`Opportunity`, `Risk`, `Update`, `Resource`).
- `urgency` (number 1-5)
- `relevance` (number 1-5)
- `confidence` (number 1-5)
- `owner` (string; optional, defaults to `Unassigned`)
- `createdAt` (ISO timestamp)

## Ranking compatibility rule

Adapter output must preserve Vela scoring semantics:

- Baseline score: `score = urgency * 2 + relevance + confidence`
- Weighted decision score (Discord pipeline): `weighted = revenue*0.35 + product*0.25 + risk*0.25 + leverage*0.15`
- deterministic sort: `weighted desc -> createdAt desc -> title asc`

### Weighted rubric dimensions

Each normalized signal should include four integer dimensions (`1..5`):

- `revenue`: direct opportunity/monetization impact
- `product`: implementation/product-delivery impact
- `risk`: downside or failure exposure
- `leverage`: repeatability/systemic multiplier

## Local validation requirements

- Clamp numeric scoring fields to `1..5`.
- Reject/skip rows missing required identity fields (`externalId`, `title`, `source`, `category`, `createdAt`).
- Preserve original export file as proof input artifact.

## Security posture

- No API keys or secrets required.
- Uses offline exported JSON only.
- Suitable for judge reproducibility and submission evidence.