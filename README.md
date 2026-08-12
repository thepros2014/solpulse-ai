# Automagic Pro

> *by RJRC Digital Development* — "It should just work"
>
> The ultimate "hands-free" AI agent starter kit for hunting, evaluating, and winning bounties on autopilot.

[![Status](https://img.shields.io/badge/Status-Automated-14F195?style=flat-square)](#)
[![Agent](https://img.shields.io/badge/AI-Llama_3.1-00C2FF?style=flat-square)](#)
[![Platform](https://img.shields.io/badge/Platform-Superteam_Earn-black?style=flat-square)](#)

---

##  Overview

**Automagic Pro** is a fully automated, cloud-based AI agent designed to run 24/7 without consuming paid API credits. It utilizes a massive, local instance of **Llama 3.1** running inside a free GitHub Action to constantly monitor, evaluate, and submit proposals to open bounties.

Whether you are a solo developer, an agency, or an AI enthusiast, Automagic Pro allows you to scale your outreach and win bounties while you sleep.

---

##  Key Features

1. **Zero-Cost Cloud Intelligence**
   Runs a massive 8B parameter AI model (Llama 3.1) entirely within the free tier of GitHub Actions. No OpenAI bills. No Anthropic limits.
2. **"God-Mode" Persona Execution**
   The AI utilizes Chain-of-Thought reasoning to perform deep technical analysis on bounties (Rust, React, Python, Design, etc.) and writes elite, professional proposals.
3. **100% Autonomous Submission**
   If the AI determines it can win the bounty, it automatically executes the submission API to lock in your proposal instantly.
4. **Push Notifications via Telegram**
   Connect your Telegram app to receive instant mobile push notifications the exact second the agent submits a proposal on your behalf.
5. **Set and Forget**
   Configured to wake up every 12-24 hours via cron job. You never have to touch it once deployed.

---

##  Getting Started

If you have purchased this product, welcome! Getting your automated agent online takes less than 5 minutes. 

You do **not** need to know how to code to launch this. 

Please follow the step-by-step instructions in the [Setup Guide](SETUP_GUIDE.md).

---

##  Configuration

You can easily adjust the agent's behavior by modifying the `config.json` file. No python knowledge required!

- `MINIMUM_FIT_SCORE`: The threshold (out of 10) required for the AI to submit a proposal. Set to `1` to submit to everything.
- `DEFAULT_PORTFOLIO_LINK`: The Github or Website link the agent will attach to all proposals as your proof of work.

---

## License

**Proprietary Commercial Software**. 
This software is strictly licensed for use by the purchaser. Unauthorized resale, distribution, or sublicensing is strictly prohibited. See `LICENSE` for details.
