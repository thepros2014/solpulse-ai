# SolPulse AI — Internal JSON API Reference

> Version: `1.0` | Authored by `antigravity-agent`
> These are the internal data formats consumed by `app.js` and produced by `engine/runEngine.js`. No external HTTP server is involved — these are static JSON files read directly by the browser and the Node.js signal engine.

---

## Table of Contents

- [Overview](#overview)
- [`data/narratives.json`](#datanarativesjson)
  - [Top-Level Schema](#top-level-schema-narrativesjson)
  - [`report_metadata` Object](#report_metadata-object)
  - [`narratives` Array Item](#narratives-array-item)
  - [`data_sources_and_signal_strength` Object](#data_sources_and_signal_strength-object)
  - [`product_build_ideas` Array Item](#product_build_ideas-array-item)
  - [Full Example Payload](#full-example-payload-narrativesjson)
- [`data/signals.json`](#datasignalsjson)
  - [Top-Level Schema](#top-level-schema-signalsjson)
  - [`narrativeScores` Array Item](#narrativescores-array-item)
  - [`repoTelemetry` Array Item](#repotelemetry-array-item)
  - [`fortnightlyHistory` Array Item](#fortnightlyhistory-array-item)
  - [`topContracts` Array Item](#topcontracts-array-item)
  - [`topKOLSignals` Array Item](#topkolsignals-array-item)
  - [Full Example Payload](#full-example-payload-signalsjson)
- [Relationship Between Files](#relationship-between-files)
- [Validation](#validation)

---

## Overview

SolPulse AI uses two JSON data files as its internal intelligence data bus:

| File | Producer | Consumer | Updated |
|------|----------|----------|---------|
| `data/narratives.json` | `antigravity-agent` (manual/agent run) | `app.js` (dashboard), `engine/runEngine.js` | Per fortnightly cycle |
| `data/signals.json` | `engine/runEngine.js` (automated) | `app.js` (dashboard) | Per engine run |

Both files are loaded client-side by `app.js` using `fetch()` and rendered into the dashboard UI. The signal engine reads `narratives.json` as its input and writes `signals.json` as its output.

---

## `data/narratives.json`

### Top-Level Schema (narratives.json)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `report_metadata` | `object` | ✅ | Metadata about the current intelligence cycle |
| `narratives` | `array<NarrativeItem>` | ✅ | Ordered array of detected ecosystem narratives |

---

### `report_metadata` Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | `string` | Human-readable report title | `"Solana Ecosystem Fortnightly Intelligence & Emerging Narrative Synthesis"` |
| `period` | `string` | Fortnight label | `"August 2026 - First Fortnight"` |
| `timestamp` | `string` | ISO-8601 timestamp of agent run | `"2026-08-07T19:09:42-07:00"` |
| `analyst` | `string` | Authoring entity | `"Solana Narrative & Intelligence Analyst"` |
| `ecosystem_phase` | `string` | Human summary of current Solana phase | `"Post-Firedancer Mainnet Deployment & ZK-Compression Scale Era"` |

---

### `narratives` Array Item

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unique narrative identifier. Format: `solana-narrative-YYYY-MM-NN` |
| `title` | `string` | ✅ | Full narrative title (used in dashboard cards and `signals.json` linking) |
| `detailed_explanation` | `string` | ✅ | Long-form markdown-compatible description of the narrative (2–5 paragraphs) |
| `data_sources_and_signal_strength` | `object` | ✅ | Signal evidence object (see below) |
| `product_build_ideas` | `array<BuildIdea>` | ✅ | 3–5 concrete product ideas derived from this narrative |

**`id` Format Constraints:**
- Pattern: `solana-narrative-YYYY-MM-NN` where `NN` is a zero-padded sequence number within the fortnight.
- Example: `"solana-narrative-2026-08-01"`, `"solana-narrative-2026-08-05"`
- Must be globally unique across all fortnights.

---

### `data_sources_and_signal_strength` Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `github_commit_velocity` | `string` | ✅ | Prose description of GitHub signal evidence, including % delta and repo names |
| `helius_rpc_tx_spikes` | `string` | ✅ | Prose description of on-chain telemetry evidence from Helius RPC |
| `kol_posts` | `array<KOLPost>` | ✅ | Array of KOL post objects (minimum 1, typically 3) |
| `research_reports` | `array<ResearchReport>` | ✅ | Array of research report citations |
| `overall_signal_strength` | `string` | ✅ | Human-readable tier label. Allowed values: `"Very High (Consensus Tier 1)"`, `"Very High (High Momentum)"`, `"Very High (Institutional Dominance)"`, `"High (Strong Hardware Expansion)"` |

**`KOLPost` Object:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `author` | `string` | Name and handle | `"Toly (@aeyakovenko)"` |
| `platform` | `string` | Platform(s) | `"X / Farcaster"` |
| `post_summary` | `string` | Paraphrase or direct quote of the post content | `"Solana state bloat is officially solved..."` |

**`ResearchReport` Object:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `source` | `string` | Publisher(s) | `"Messari / Helius Research"` |
| `report_title` | `string` | Full report title | `"ZK-Compression: The End of State Bloat..."` |
| `key_takeaways` | `string` | 1–3 sentence summary of the most relevant findings | `"ZK-Compression v2 reduces account rent by 99.98%..."` |

---

### `product_build_ideas` Array Item

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idea_title` | `string` | ✅ | Short product name (used as card heading in dashboard) |
| `target_users` | `string` | ✅ | Comma-separated description of target user personas |
| `tech_architecture_outline` | `string` | ✅ | Technical stack and architecture description (2–4 sentences) |
| `value_proposition` | `string` | ✅ | Core value prop in 1–2 sentences |

---

### Full Example Payload (narratives.json)

```json
{
  "report_metadata": {
    "title": "Solana Ecosystem Fortnightly Intelligence & Emerging Narrative Synthesis",
    "period": "August 2026 - First Fortnight",
    "timestamp": "2026-08-07T19:09:42-07:00",
    "analyst": "Solana Narrative & Intelligence Analyst",
    "ecosystem_phase": "Post-Firedancer Mainnet Deployment & ZK-Compression Scale Era"
  },
  "narratives": [
    {
      "id": "solana-narrative-2026-08-01",
      "title": "ZK-Compression v2 & Native zkSVM State Scaling for Enterprise Privacy and Hyper-Scale Accounts",
      "detailed_explanation": "ZK-Compression on Solana has reached v2 maturity...",
      "data_sources_and_signal_strength": {
        "github_commit_velocity": "lightprotocol/light-protocol and helius-labs/zk-compression saw a +340% commit velocity surge...",
        "helius_rpc_tx_spikes": "ZK validity proof verification transactions surged from 4.2M to 18.7M daily (+345% MoM)...",
        "kol_posts": [
          {
            "author": "Toly (@aeyakovenko)",
            "platform": "X / Farcaster",
            "post_summary": "Solana state bloat is officially solved..."
          }
        ],
        "research_reports": [
          {
            "source": "Messari / Helius Research",
            "report_title": "ZK-Compression: The End of State Bloat & The Dawn of Institutional Confidentiality on Solana (Aug 2026)",
            "key_takeaways": "ZK-Compression v2 reduces account rent expenditure by 99.98%..."
          }
        ],
        "overall_signal_strength": "Very High (Consensus Tier 1)"
      },
      "product_build_ideas": [
        {
          "idea_title": "zkPayroll Solana",
          "target_users": "Global Web3 enterprises, DAOs, international remote staffing platforms.",
          "tech_architecture_outline": "Built using Light Protocol v2 SDK and Token-2022 Confidential Transfer hooks...",
          "value_proposition": "Enables mass 10,000-employee batch payouts in a single block for less than $0.05 total tx fee."
        }
      ]
    }
  ]
}
```

---

## `data/signals.json`

### Top-Level Schema (signals.json)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `updatedAt` | `string` | ✅ | ISO-8601 UTC timestamp of last engine run |
| `cyclePeriod` | `string` | ✅ | Human-readable fortnight label | `"Fortnight 16 (Aug 2026)"` |
| `totalNarratives` | `integer` | ✅ | Count of narratives in this cycle |
| `avgMomentumScore` | `number` | ✅ | Float average NMS across all narratives (0–100) |
| `signalSourcesCount` | `integer` | ✅ | Total signal data points analyzed this cycle |
| `sourcesBreakdown` | `object` | ✅ | Breakdown of signal source counts by type |
| `narrativeScores` | `array<NarrativeScore>` | ✅ | Per-narrative NMS scores and sub-scores |
| `fortnightlyHistory` | `array<HistoryPoint>` | ✅ | 6-fortnight momentum trend data for the line chart |
| `topContracts` | `array<Contract>` | ✅ | Top 5 on-chain programs by 24h call volume |
| `topKOLSignals` | `array<KOLSignal>` | ✅ | Top 3 featured KOL signal quotes |

**`sourcesBreakdown` Object:**

| Field | Type | Description |
|-------|------|-------------|
| `githubRepositories` | `integer` | Number of GitHub repository data points analyzed |
| `onchainContracts` | `integer` | Number of on-chain program addresses monitored |
| `kolPostsAnalyzed` | `integer` | Number of KOL posts and research reports processed |

---

### `narrativeScores` Array Item

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `narrativeId` | `string` | ✅ | Foreign key — matches `id` in `narratives.json` |
| `title` | `string` | ✅ | Denormalized narrative title for convenience |
| `momentumScore` | `integer` | ✅ | Final NMS score (0–100, integer rounded). `NMS = 0.4×GH + 0.35×OC + 0.25×KOL` |
| `signals` | `object` | ✅ | Sub-scores for each signal layer (see below) |
| `fortnightlyVolume` | `string` | ✅ | Estimated fortnightly on-chain volume for this narrative category. Format: `"$XXXm"` or `"$X.XB"` |
| `changePercent` | `number` | ✅ | Percentage change vs prior fortnight (positive = growth) |
| `repoTelemetry` | `array<RepoTelemetry>` | ✅ | Raw GitHub stats for each monitored repo |

**`signals` Object:**

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `githubVelocity` | `integer` | GitHub signal sub-score | 0–100 |
| `onchainSpikes` | `integer` | On-chain activity sub-score | 0–100 |
| `kolSentiment` | `integer` | KOL/social sentiment sub-score | 0–100 |

---

### `repoTelemetry` Array Item

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | `true` if live GitHub API data was fetched; `false` if fallback baseline was used |
| `owner` | `string` | GitHub organisation or username |
| `repo` | `string` | Repository name |
| `stars` | `integer` | Total stargazer count at time of fetch |
| `forks` | `integer` | Total fork count at time of fetch |
| `daysSincePush` | `number` | Floating-point days since last push to default branch (1 decimal place) |
| `score` | `integer` | Computed GitHub velocity sub-score for this repo (60–99) |

---

### `fortnightlyHistory` Array Item

Historical momentum index for trend line rendering. One item per fortnight (most recent 6 fortnights).

| Field | Type | Description |
|-------|------|-------------|
| `fortnight` | `string` | Fortnight label. Format: `"FN XX"` |
| `defai` | `integer` | DeFAI narrative momentum index |
| `depin` | `integer` | DePIN narrative momentum index |
| `blinks` | `integer` | Solana Blinks / Actions narrative momentum index |
| `zk` | `integer` | ZK-Compression narrative momentum index |
| `micropay` | `integer` | x402 Micro-payments / Agentic economy momentum index |
| `lst` | `integer` | Liquid Staking Token narrative momentum index |

> **Note:** Momentum index values are not capped at 100 — they represent relative acceleration and can exceed 100 during breakout periods. They are normalized for chart rendering by `app.js`.

---

### `topContracts` Array Item

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | `string` | Shortened on-chain program address (display only) | `"JUP6LkbZbjS1jKKwapdHNy74zbUWv76D095128"` |
| `label` | `string` | Human-readable program name | `"Jupiter v6 Router"` |
| `calls24h` | `string` | 24-hour call count with unit suffix | `"14.2M"` |
| `growth` | `string` | Formatted WoW growth percentage | `"+32%"` |

---

### `topKOLSignals` Array Item

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `author` | `string` | Twitter/X handle | `"@toly"` |
| `role` | `string` | Role/title | `"Solana Co-Founder"` |
| `quote` | `string` | Paraphrase or direct quote (max ~160 chars for card display) | `"Solana state bloat is officially solved..."` |
| `engagement` | `string` | Formatted engagement string | `"4.8k likes • 940 retweets"` |
| `sentiment` | `integer` | Sentiment score (0–100) for this specific signal | `98` |

---

### Full Example Payload (signals.json)

```json
{
  "updatedAt": "2026-08-08T02:21:17.278Z",
  "cyclePeriod": "Fortnight 16 (Aug 2026)",
  "totalNarratives": 5,
  "avgMomentumScore": 91.4,
  "signalSourcesCount": 1495,
  "sourcesBreakdown": {
    "githubRepositories": 520,
    "onchainContracts": 335,
    "kolPostsAnalyzed": 690
  },
  "narrativeScores": [
    {
      "narrativeId": "solana-narrative-2026-08-01",
      "title": "ZK-Compression v2 & Native zkSVM State Scaling...",
      "momentumScore": 94,
      "signals": {
        "githubVelocity": 94,
        "onchainSpikes": 95,
        "kolSentiment": 94
      },
      "fortnightlyVolume": "$450M",
      "changePercent": 34.5,
      "repoTelemetry": [
        {
          "success": true,
          "owner": "lightprotocol",
          "repo": "light-protocol",
          "stars": 340,
          "forks": 97,
          "daysSincePush": 4.6,
          "score": 99
        }
      ]
    }
  ],
  "fortnightlyHistory": [
    { "fortnight": "FN 11", "defai": 52, "depin": 45, "blinks": 30, "zk": 40, "micropay": 20, "lst": 70 },
    { "fortnight": "FN 16", "defai": 182, "depin": 154, "blinks": 160, "zk": 115, "micropay": 195, "lst": 92 }
  ],
  "topContracts": [
    {
      "name": "JUP6LkbZbjS1jKKwapdHNy74zbUWv76D095128",
      "label": "Jupiter v6 Router",
      "calls24h": "14.2M",
      "growth": "+32%"
    }
  ],
  "topKOLSignals": [
    {
      "author": "@toly",
      "role": "Solana Co-Founder",
      "quote": "Solana state bloat is officially solved. ZK compression gives us stateless execution semantics.",
      "engagement": "4.8k likes • 940 retweets",
      "sentiment": 98
    }
  ]
}
```

---

## Relationship Between Files

```
narratives.json                    signals.json
──────────────                     ────────────
narratives[].id         ←──────── narrativeScores[].narrativeId
narratives[].title      ←──────── narrativeScores[].title (denormalized)
narratives[].product_   ──────►  (rendered as cards alongside signals)
    build_ideas
```

The `narrativeId` field in `signals.json` is a **foreign key** back to the `id` field in `narratives.json`. The dashboard `app.js` performs a client-side join on this field to co-locate build idea content with NMS score data when rendering narrative cards.

---

## Validation

### Validate JSON Syntax

```bash
# Validate narratives.json
node -e "JSON.parse(require('fs').readFileSync('data/narratives.json','utf8')); console.log('✅ narratives.json valid')"

# Validate signals.json
node -e "JSON.parse(require('fs').readFileSync('data/signals.json','utf8')); console.log('✅ signals.json valid')"
```

### Validate NMS Formula

All `momentumScore` values in `signals.json` must satisfy:

```
|momentumScore - round(0.40 × githubVelocity + 0.35 × onchainSpikes + 0.25 × kolSentiment)| ≤ 1
```

(Tolerance of ±1 accounts for rounding in the blending step with `BASELINE_SIGNALS`.)

### Schema Constraints Summary

| Constraint | Rule |
|---|---|
| `narrativeId` format | Must match `^solana-narrative-\d{4}-\d{2}-\d{2}$` |
| `momentumScore` | Integer in `[0, 100]` |
| `signals.*` fields | Integer in `[0, 100]` |
| `score` (repoTelemetry) | Integer in `[60, 99]` |
| `daysSincePush` | Non-negative float, 1 decimal place |
| `fortnightlyHistory` key fields | All non-negative integers |
| `updatedAt` | Valid ISO-8601 UTC string |
