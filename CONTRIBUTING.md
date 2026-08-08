# Contributing to SolPulse AI

Thank you for your interest in contributing to **SolPulse AI** — an autonomous Solana ecosystem intelligence system built by an AI agent team (`antigravity-agent`) in collaboration with human developers.

This project operates under a unique **agent-human collaboration model** described in detail below. Please read this guide fully before opening issues or submitting pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Agent-Human Collaboration Model](#agent-human-collaboration-model)
- [Getting Started](#getting-started)
  - [Fork & Clone](#fork--clone)
  - [Running Locally](#running-locally)
  - [Running the Signal Engine](#running-the-signal-engine)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Proposing Narratives](#proposing-narratives)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Code Style & Standards](#code-style--standards)
- [Data File Standards](#data-file-standards)
- [Narrative Contribution Guidelines](#narrative-contribution-guidelines)
- [Project Architecture Summary](#project-architecture-summary)

---

## Code of Conduct

This project adheres to a simple rule: **be constructive, be specific, be data-driven**. Ecosystem narrative proposals without supporting signal evidence (GitHub velocity, on-chain spikes, or KOL posts) will be closed. Personal attacks, spam, or off-topic discussions will not be tolerated.

---

## Agent-Human Collaboration Model

SolPulse AI was conceived, designed, and iteratively built by the `antigravity-agent` — an autonomous AI intelligence system with access to GitHub APIs, on-chain telemetry, and ecosystem research. This is **not a traditional open-source project** with a purely human maintainer team.

**What the agent does:**
- Autonomously runs the `engine/runEngine.js` signal detection pipeline on a fortnightly cadence.
- Detects emerging Solana ecosystem narratives by analyzing GitHub commit velocity, Helius RPC transaction spikes, and KOL post sentiment.
- Synthesizes 3–5 concrete, high-conviction product build ideas per narrative.
- Updates `data/narratives.json` and `data/signals.json` with fresh intelligence outputs.
- Generates and maintains documentation, including this file.

**What human contributors do:**
- Submit bug reports for signal engine failures or incorrect NMS calculations.
- Propose new narratives via the **Narrative / Feature Request** issue template.
- Improve frontend components (`index.html`, `style.css`, `app.js`) and documentation.
- Contribute to `projects/zkPayroll` — the flagship Anchor program built from detected narratives.
- Review and sanity-check agent-generated narrative content.

**Key principle:** Agent-generated content in `data/narratives.json` is ground truth for narrative intelligence. Human contributors should not manually edit that file without corresponding signal evidence. All narrative changes must go through the issue-and-PR workflow so the agent can reconcile them on the next engine run.

---

## Getting Started

### Fork & Clone

```bash
# 1. Fork the repository on GitHub using the "Fork" button

# 2. Clone your fork
git clone https://github.com/<your-username>/solpulse-ai.git
cd solpulse-ai

# 3. Add the upstream remote
git remote add upstream https://github.com/thepros2014/solpulse-ai.git
```

### Running Locally

The dashboard is a zero-dependency static frontend — no bundler, no build step.

```bash
# Option A: Python (standard)
python -m http.server 8000

# Option B: Node.js http-server
npx http-server . -p 8000

# Option C: VS Code Live Server extension
# Open index.html → right-click → "Open with Live Server"
```

Then visit [http://localhost:8000](http://localhost:8000).

> **Note:** The dashboard reads from `data/narratives.json` and `data/signals.json` at runtime. These files are pre-populated with the latest agent run and work offline.

### Running the Signal Engine

The signal engine requires Node.js v18+ and internet access (GitHub API, optionally Helius RPC).

```bash
# Install dependencies (none currently — engine uses Node.js built-ins)
node --version  # Verify >= 18.0.0

# Run the full signal detection pipeline
node engine/runEngine.js
```

This will:
1. Fetch live GitHub repository stats for all narrative-mapped repos.
2. Compute NMS scores using the weighted formula.
3. Write updated `data/signals.json`.

To add a GitHub API token (recommended to avoid rate limits):

```bash
# Set the environment variable before running
set GITHUB_TOKEN=ghp_your_token_here   # Windows
export GITHUB_TOKEN=ghp_your_token_here  # macOS/Linux
node engine/runEngine.js
```

---

## How to Contribute

### Reporting Bugs

Use the [🐛 Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Include:
- The exact error message or unexpected output.
- Steps to reproduce reliably.
- Your OS, Node.js version, and browser if UI-related.

### Proposing Narratives

Use the [💡 Narrative / Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template. A valid narrative proposal **must include**:
- At least one GitHub repository with measurable commit acceleration.
- At least one on-chain signal (program call spike, TVL jump, new deployment).
- At least one KOL post or credible research report citation.
- Two or more concrete product build ideas.

Proposals without signal evidence will be labelled `needs-signal-data` and closed after 14 days if not updated.

### Submitting Pull Requests

```bash
# 1. Sync your fork with upstream
git fetch upstream
git checkout main
git merge upstream/main

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes and commit using conventional commits
git add .
git commit -m "feat(engine): add Helius WebSocket RPC signal source"

# 4. Push to your fork
git push origin feat/your-feature-name

# 5. Open a PR on GitHub targeting the main branch
```

**PR requirements:**
- [ ] Title follows [Conventional Commits](https://www.conventionalcommits.org/) format (`feat`, `fix`, `docs`, `refactor`, `chore`).
- [ ] Description explains *what* changed and *why*, with references to any related issues.
- [ ] All JSON data files remain valid (run `node -e "JSON.parse(require('fs').readFileSync('data/signals.json','utf8'))"` to verify).
- [ ] No hardcoded private keys, API tokens, or wallet addresses.

---

## Code Style & Standards

**JavaScript** (`engine/`, `app.js`, `projects/zkPayroll/app.js`):
- ES2020+ syntax. No TypeScript at root level (TypeScript is used in the zkPayroll SDK — see `projects/zkPayroll/sdk/`).
- Use `const` and `let`; never `var`.
- JSDoc comments on all exported functions (see `engine/signalFetcher.js` for the standard format).
- Async/await preferred over raw Promises.
- 2-space indentation, single quotes for strings.

**CSS** (`style.css`, `projects/zkPayroll/style.css`):
- BEM-lite class naming where possible.
- CSS custom properties (`--var-name`) for all theme colours and spacing tokens.
- Dark glassmorphism theme must be preserved — do not introduce conflicting light-mode styles without a media query.

**Rust** (`projects/zkPayroll/programs/zk-payroll/src/lib.rs`):
- Follow standard `cargo fmt` formatting.
- All Anchor account validation constraints must include explicit `#[error_code]` messages.
- Zero-copy account structs (`#[account(zero_copy)]`) preferred for high-throughput state.
- No `unwrap()` in production paths — use `?` operator with typed errors.

**Markdown** (all `.md` files):
- ATX-style headers (`##`), not underline-style.
- Tables for comparative data.
- Code blocks with language identifiers.

---

## Data File Standards

### `data/narratives.json`
- Top-level keys: `report_metadata`, `narratives` (array).
- Each narrative object must include: `id`, `title`, `detailed_explanation`, `data_sources_and_signal_strength`, `product_build_ideas`.
- Narrative IDs follow the format: `solana-narrative-YYYY-MM-NN`.
- Do **not** manually edit this file without a corresponding engine run or a well-documented PR.

### `data/signals.json`
- Machine-generated by `engine/runEngine.js` — treat as build output.
- PRs modifying this file directly should only fix schema violations, never tweak NMS scores manually.

---

## Narrative Contribution Guidelines

When writing or editing narrative content for `docs/NARRATIVES.md` or proposing additions to `data/narratives.json`:

1. **Be specific about technology.** "Solana is fast" is not a narrative signal. "The `zk-sdk` crate added `avx512` CUDA prover support causing a +340% commit delta" is.
2. **Cite primary sources.** Link to GitHub PRs, Helius explorer links, Messari reports, or specific posts.
3. **Build ideas must be Solana-native.** Multi-chain abstractions are out of scope for this intelligence system.
4. **NMS score justification is required.** Explain your weighting reasoning using the formula: `NMS = 0.40 × GitHub_Velocity + 0.35 × OnChain_Spikes + 0.25 × KOL_Sentiment`.

---

## Project Architecture Summary

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical deep-dive. In brief:

```
Signal Sources (GitHub API + Helius RPC + KOL Posts)
         ↓
engine/signalFetcher.js  ← fetches & scores raw signals
         ↓
engine/runEngine.js      ← orchestrates pipeline, writes data/signals.json
         ↓
data/narratives.json     ← curated intelligence (agent-authored)
data/signals.json        ← computed NMS scores (machine-generated)
         ↓
index.html + app.js      ← dashboard reads JSON, renders UI
         ↓
projects/zkPayroll/      ← flagship dApp built from Narrative #1
```

---

*This contributing guide was authored by the `antigravity-agent` and is updated automatically alongside project milestones.*
