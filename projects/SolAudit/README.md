# SolAudit

**SolAudit** is an autonomous Solana smart contract security education and analysis tool. This project is a Superteam Earn bounty submission demonstrating an AI agent that identifies common vulnerability patterns in Solana Anchor programs and generates remediation guides.

**IMPORTANT:** All vulnerability examples are **synthetic/educational** — modeled after well-documented, publicly known Solana vulnerability classes. Do NOT target or scan any real production program with this toy scanner.

## Vulnerability Classes Detected
1. Missing signer check (account marked `mut` but no `signer` constraint)
2. Missing owner check (no `constraint = account.owner == program_id`)
3. Integer overflow (arithmetic without `checked_add/sub/mul`)
4. PDA bump seed not stored/validated
5. Unchecked `unwrap()` on fallible operations
6. Re-initialization attack (no check preventing re-init of already initialized accounts)

## How to Run

1. Make sure you have Node.js installed.
2. Run the agent scanner:
   ```bash
   node agent/auditor.js
   ```
   This command scans the synthetic examples in `data/vulnerable_examples/` and generates `data/audit_findings.json`.
3. Open `index.html` in your web browser (or serve it via a local web server to avoid CORS issues with fetching local JSON).
4. Review the generated security dashboard!

## Disclaimer
The files in `data/vulnerable_examples/` are fictional programs for educational demonstration only.
