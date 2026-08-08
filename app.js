/**
 * SolPulse AI - Solana Fortnightly Narrative & Idea Generator
 * Main Application Engine
 */

(function () {
  'use strict';

  // State Management
  const state = {
    narratives: [],
    signals: null,
    activeTab: 'tab-dashboard',
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'momentum-desc',
    selectedNarrativeForModal: null,
    apiDataset: 'narratives',
    apiSearchQuery: '',
    matrixChartType: 'bar',
    matrixChartInstance: null,
    trendChartInstance: null
  };

  // Fallback Data in case fetch fails (e.g. running standalone file://)
  const FALLBACK_NARRATIVES = [
    {
      "id": "nar-defai-agents",
      "title": "DeFAI Autonomous Trading & Liquidity Agents",
      "subtitle": "AI-driven autonomous agents executing high-frequency Solana DEX routes & vault rebalancing",
      "category": "AI x DeFi",
      "momentumScore": 96,
      "changePercent": 24.5,
      "fortnightlyVolume": "$420M",
      "signals": { "githubVelocity": 94, "onchainSpikes": 98, "kolSentiment": 95 },
      "tags": ["Autonomous Agents", "JUP Routing", "xERC20", "DeFAI", "Raydium CPMM"],
      "description": "Explosive growth in autonomous agent frameworks (e.g., Eliza, Rig, LangChain Solana extensions) leveraging Solana's low latency and cheap gas for automated market making, arbitrage, and social sentiment trading.",
      "commitTrend": [65, 78, 88, 110, 145, 182],
      "buildIdeas": [
        {
          "id": "idea-101",
          "title": "AgentVault: Non-Custodial Multi-Strategy AI Agent",
          "description": "A smart wallet wrapper on Solana where users delegate trading budgets to specialized AI agent strategies with hard stop-loss circuit breakers.",
          "targetStack": "Anchor (Rust), Solana Web3.js v2, TypeScript, LangChain / Rig, Jupiter Swap API",
          "complexity": "High",
          "estTime": "2-3 weeks",
          "revenueModel": "0.5% management fee + 10% performance fee on profitable yield rebalancing",
          "prompt": "Create an Anchor program and Web3 frontend for delegating SOL to an AI agent keypair with daily withdrawal caps and automated Jupiter swap execution."
        },
        {
          "id": "idea-102",
          "title": "BlinkAgent: Telegram & X Social Copy-Trading Agent",
          "description": "Solana Actions & Blinks powered agent that parses alpha calls on X/Telegram, validates liquidity on Orca/Jupiter, and renders instant execution blinks.",
          "targetStack": "Next.js, Solana Blinks SDK, Helius Webhooks, OpenAI API",
          "complexity": "Medium",
          "estTime": "1-2 weeks",
          "revenueModel": "Micro-transaction fee per Blink swap execution",
          "prompt": "Build a Next.js API route that listens to X post webhooks, extracts token mint addresses, runs RPC slippage checks, and generates a Solana Action URL."
        },
        {
          "id": "idea-103",
          "title": "DeFAI Guard: AI Contract Auditor & Real-time Slippage Shield",
          "description": "On-chain transaction simulation engine powered by AI that detects honeypots, tax tokens, and high-mev routes before signing.",
          "targetStack": "Rust, Helius RPC, TailwindCSS, Chart.js",
          "complexity": "Medium",
          "estTime": "1-2 weeks",
          "revenueModel": "Freemium tier, $19/mo pro subscription for automated front-running protection",
          "prompt": "Write a TypeScript simulation pipeline using Helius RPC `simulateTransaction` and LLM prompt to score token trust levels before user approval."
        }
      ]
    },
    {
      "id": "nar-depin-compute",
      "title": "DePIN x AI Compute & Edge Networks",
      "subtitle": "Decentralized GPU orchestration, AI inference verification, and physical node telemetry on Solana",
      "category": "DePIN & AI",
      "momentumScore": 91,
      "changePercent": 18.2,
      "fortnightlyVolume": "$310M",
      "signals": { "githubVelocity": 89, "onchainSpikes": 92, "kolSentiment": 92 },
      "tags": ["Render", "io.net", "GPU Aggregation", "zkProof Inference", "State Compression"],
      "description": "Physical infrastructure networks using Solana state compression to log millions of compute heartbeats and reward distribution events with sub-cent transaction costs.",
      "commitTrend": [45, 52, 70, 95, 120, 154],
      "buildIdeas": [
        {
          "id": "idea-201",
          "title": "EdgePulse: Real-Time DePIN GPU Capacity Oracle",
          "description": "Aggregated dashboard & Pyth-compatible oracle tracking live GPU rent prices across io.net, Render, and Akash on Solana.",
          "targetStack": "Solana Web3.js, Pyth Network, Vue/React, ECharts",
          "complexity": "Medium",
          "estTime": "2 weeks",
          "revenueModel": "Oracle data feed subscription for dApps & algorithmic buyers",
          "prompt": "Develop a Solana oracle aggregator fetching GPU node uptime telemetry and publishing benchmarked compute prices on-chain."
        },
        {
          "id": "idea-202",
          "title": "CompressedDePIN: Lightweight Device Registry",
          "description": "State compression framework enabling DePIN projects to register millions of IoT sensors as cNFTs for micro-rewards.",
          "targetStack": "Anchor Rust, Bubblegum (cNFT), Metaplex Digital Asset Standard",
          "complexity": "High",
          "estTime": "3 weeks",
          "revenueModel": "SaaS protocol deployment fee + cNFT minting fee",
          "prompt": "Create an Anchor program for DePIN device onboarding using Metaplex Bubblegum tree minting and batch compressed transfers."
        },
        {
          "id": "idea-203",
          "title": "ComputeStake: Fractionalized DePIN Node Staking",
          "description": "Liquid staking protocol allowing retail users to pool SOL into physical DePIN hardware nodes and share daily compute rewards.",
          "targetStack": "Anchor, SPL Token 2022, React, TailwindCSS",
          "complexity": "High",
          "estTime": "3 weeks",
          "revenueModel": "3% reward fee on distributed compute yields",
          "prompt": "Design an SPL Token-2022 vault with transfer hooks that distribute proportional DePIN GPU compute rewards."
        }
      ]
    },
    {
      "id": "nar-blinks-actions",
      "title": "Solana Actions & Blinks 2.0 (Everywhere Web3)",
      "subtitle": "Unlocking embedded Web3 transactions inside X, Discord, Reddit, and web applications",
      "category": "Consumer & UX",
      "momentumScore": 88,
      "changePercent": 14.8,
      "fortnightlyVolume": "$185M",
      "signals": { "githubVelocity": 92, "onchainSpikes": 85, "kolSentiment": 87 },
      "tags": ["Blinks", "Solana Actions", "Social Commerce", "Frame SDK", "Dialect"],
      "description": "Transforming any URL into an interactive Solana transaction trigger, enabling instant tipping, NFT mints, crowd-funding, and governance voting directly inside social feeds.",
      "commitTrend": [30, 48, 80, 115, 130, 160],
      "buildIdeas": [
        {
          "id": "idea-301",
          "title": "BlinkPay: One-Click E-Commerce Checkout Blink",
          "description": "Shopify and WooCommerce plugin that turns store product URLs into interactive Solana Action blinks for instant USDC payment.",
          "targetStack": "TypeScript, Next.js, Solana Pay, Shopify API",
          "complexity": "Medium",
          "estTime": "1-2 weeks",
          "revenueModel": "0.2% checkout fee per merchant transaction",
          "prompt": "Build an open-action spec handler that verifies cart inventory and returns a signed transaction payload for Solana Pay USDC transfer."
        },
        {
          "id": "idea-302",
          "title": "BlinkPoll: Token-Gated On-Chain Social Surveys",
          "description": "Create instant X/Twitter surveys where votes are recorded on Solana with quadratic voting weight powered by user token balances.",
          "targetStack": "Solana Actions, Anchor, Helius RPC",
          "complexity": "Low",
          "estTime": "1 week",
          "revenueModel": "Premium survey features & boosted feed placement",
          "prompt": "Develop an action GET/POST endpoint that checks voter SPL token balance and builds a vote transaction on Solana."
        },
        {
          "id": "idea-303",
          "title": "BlinkRaffle: Gamified Viral Twitter Giveaway Engine",
          "description": "Seamless raffle engine where participating in a tweet thread automatically registers your Solana wallet and mints a provably fair ticket.",
          "targetStack": "Anchor Rust, Switchboard VRF, Next.js Actions",
          "complexity": "Medium",
          "estTime": "2 weeks",
          "revenueModel": "Small entry ticket protocol fee",
          "prompt": "Implement a Switchboard VRF random winner selector tied to Solana Action ticket purchases."
        }
      ]
    },
    {
      "id": "nar-zk-compression",
      "title": "ZK Privacy, Light Protocol & Compressed NFTs",
      "subtitle": "Ultra-scalable state compression and zero-knowledge private token transfers",
      "category": "Infrastructure & ZK",
      "momentumScore": 84,
      "changePercent": 11.3,
      "fortnightlyVolume": "$240M",
      "signals": { "githubVelocity": 86, "onchainSpikes": 82, "kolSentiment": 84 },
      "tags": ["Light Protocol", "ZK Proofs", "State Compression", "Private Transfers", "Elusiv"],
      "description": "Adoption of zero-knowledge primitives and Light Protocol state trees on Solana, bringing sub-cent cost per 100,000 account states and confidential balances.",
      "commitTrend": [40, 50, 62, 75, 90, 115],
      "buildIdeas": [
        {
          "id": "idea-401",
          "title": "ZKShield: Confidential Payroll & Micro-Payouts",
          "description": "Enterprise payroll system on Solana that encrypts wallet payout amounts using Light Protocol ZK state while maintaining compliance proofs.",
          "targetStack": "Light Protocol SDK, Rust, WebAssembly, React",
          "complexity": "High",
          "estTime": "3-4 weeks",
          "revenueModel": "Subscription tier based on monthly payroll volume",
          "prompt": "Write a ZK circuit wrapper in Light Protocol to shield SPL token transfers while emitting view keys for auditable compliance."
        },
        {
          "id": "idea-402",
          "title": "CompressedPass: Mass Mint Event Ticketing System",
          "description": "Mint 100k event passes on Solana for under $10 using concurrent Merkle trees and dynamic check-in QR codes.",
          "targetStack": "Metaplex Bubblegum, Anchor, Web3Auth, Express API",
          "complexity": "Medium",
          "estTime": "2 weeks",
          "revenueModel": "$0.05 platform fee per issued event pass",
          "prompt": "Create a Node.js batch minting queue utilizing Bubblegum cNFT trees and instant QR scan redemption handlers."
        }
      ]
    },
    {
      "id": "nar-ai-agent-micropayments",
      "title": "x402 & Agent-to-Agent Micro-Billing Rails",
      "subtitle": "Programmable, per-token API payment channels for autonomous AI agents",
      "category": "AI Infrastructure",
      "momentumScore": 92,
      "changePercent": 31.0,
      "fortnightlyVolume": "$150M",
      "signals": { "githubVelocity": 95, "onchainSpikes": 90, "kolSentiment": 91 },
      "tags": ["HTTP 402", "Agent Payments", "Token 2022", "Micro-billing", "LLM APIs"],
      "description": "Standardized HTTP 402 payment required protocols using Solana sub-cent finality to enable AI agents to autonomously pay for API calls, vector DB queries, and web scraping per request.",
      "commitTrend": [20, 35, 60, 98, 140, 195],
      "buildIdeas": [
        {
          "id": "idea-501",
          "title": "PayGate402: Reverse Proxy for AI Middleware",
          "description": "Middleware proxy that converts any REST/gRPC endpoint into a micro-billed Solana API requiring micro-USDC payments.",
          "targetStack": "Node.js / Rust, Solana Pay, Token 2022, Redis",
          "complexity": "Medium",
          "estTime": "2 weeks",
          "revenueModel": "1% routing fee on micro-billing streams",
          "prompt": "Implement an Express/Fastify reverse proxy middleware that intercepts requests, checks Solana transfer signature headers, and proxies valid requests."
        },
        {
          "id": "idea-502",
          "title": "AgentBudget: Multi-Sig Key Treasury for Autonomous LLMs",
          "description": "Smart wallet for AI agents with daily rate limits, spending velocity controls, and automated Solana gas top-ups.",
          "targetStack": "Anchor Rust, Squads SDK, React, Solana Web3.js",
          "complexity": "High",
          "estTime": "3 weeks",
          "revenueModel": "Monthly vault subscription + premium telemetry",
          "prompt": "Write an Anchor smart contract with daily withdrawal caps and whitelist address checks for AI agent execution keys."
        }
      ]
    },
    {
      "id": "nar-lst-restaking",
      "title": "Jito / Liquid Restaking & Solana LST Fi",
      "subtitle": "MEV-enhanced liquid staking derivatives, restaking pools, and yield composability",
      "category": "DeFi & Staking",
      "momentumScore": 81,
      "changePercent": 8.7,
      "fortnightlyVolume": "$680M",
      "signals": { "githubVelocity": 78, "onchainSpikes": 85, "kolSentiment": 80 },
      "tags": ["JitoSOL", "MEV Rewards", "Restaking", "Sanctum", "Yield Aggregation"],
      "description": "The rapid expansion of bespoke LSTs (via Sanctum) and MEV boost mechanics powering high-yield DeFi primitives across the Solana ecosystem.",
      "commitTrend": [70, 75, 80, 82, 85, 92],
      "buildIdeas": [
        {
          "id": "idea-601",
          "title": "LSTSwitch: Instant Zero-Slippage LST Router",
          "description": "Unified liquidity aggregator mapping Sanctum custom LSTs to maximize yield and minimize exit penalties.",
          "targetStack": "Sanctum SDK, Jupiter API, React, Tailwind",
          "complexity": "Medium",
          "estTime": "1-2 weeks",
          "revenueModel": "0.1% swap routing fee",
          "prompt": "Build a React component using Sanctum Router SDK to calculate optimal LST to LST swap routes with lowest MEV impact."
        },
        {
          "id": "idea-602",
          "title": "MEV-Alert: Real-time Validator Yield & Tip Monitor",
          "description": "Analytics bot tracking validator Jito tips, block production rewards, and anomaly detection for delegators.",
          "targetStack": "Rust, Helius Webhooks, Telegram Bot API",
          "complexity": "Low",
          "estTime": "1 week",
          "revenueModel": "Paid alerts for whale delegators & validator operators",
          "prompt": "Create a Rust service listening to Jito block engine tips and dispatching instant alerts on payout anomalies."
        }
      ]
    }
  ];

  const FALLBACK_SIGNALS = {
    "updatedAt": "2026-08-07T19:00:00Z",
    "cyclePeriod": "Fortnight 16 (Aug 2026)",
    "totalNarratives": 6,
    "avgMomentumScore": 88.7,
    "signalSourcesCount": 1420,
    "sourcesBreakdown": { "githubRepositories": 480, "onchainContracts": 310, "kolPostsAnalyzed": 630 },
    "fortnightlyHistory": [
      { "fortnight": "FN 11", "defai": 52, "depin": 45, "blinks": 30, "zk": 40, "micropay": 20, "lst": 70 },
      { "fortnight": "FN 12", "defai": 65, "depin": 52, "blinks": 48, "zk": 50, "micropay": 35, "lst": 75 },
      { "fortnight": "FN 13", "defai": 78, "depin": 70, "blinks": 80, "zk": 62, "micropay": 60, "lst": 80 },
      { "fortnight": "FN 14", "defai": 110, "depin": 95, "blinks": 115, "zk": 75, "micropay": 98, "lst": 82 },
      { "fortnight": "FN 15", "defai": 145, "depin": 120, "blinks": 130, "zk": 90, "micropay": 140, "lst": 85 },
      { "fortnight": "FN 16", "defai": 182, "depin": 154, "blinks": 160, "zk": 115, "micropay": 195, "lst": 92 }
    ],
    "topContracts": [
      { "name": "JUP6LkbZbjS1jKKwapdHNy74zbUWv76D095128", "label": "Jupiter v6 Router", "calls24h": "14.2M", "growth": "+32%" },
      { "name": "BGUMAp9Gq7iUvuBhXgPyYJu5xHYtmZkq2G", "label": "Metaplex Bubblegum (cNFT)", "calls24h": "8.9M", "growth": "+45%" },
      { "name": "Jito45wWj2sk9B24559591141381389", "label": "Jito Stake Pool", "calls24h": "5.1M", "growth": "+12%" },
      { "name": "Light2222222222222222222222222222", "label": "Light Protocol ZK Tree", "calls24h": "3.4M", "growth": "+88%" }
    ],
    "topKOLSignals": [
      { "author": "@toly", "role": "Solana Co-Founder", "quote": "Autonomous agents sending 10k transactions per second for micro-inference is the ultimate test for SVM parallelism.", "engagement": "4.2k likes • 890 retweets", "sentiment": 98 },
      { "author": "@mertlmao", "role": "Helius CEO", "quote": "HTTP 402 + Solana micro-transfers means every API on Earth can be monetized with zero credit card fees.", "engagement": "3.1k likes • 620 retweets", "sentiment": 96 },
      { "author": "@solana_devs", "role": "Solana Eco", "quote": "Blinks 2.0 integration across X feeds has crossed 500k transactions daily.", "engagement": "2.8k likes • 450 retweets", "sentiment": 94 }
    ]
  };

  // Entry Point
  document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initNavigation();
    initSearchAndFilters();
    initModalEvents();
    initSynthesizerEvents();
    initApiInspectorEvents();
    renderAll();
  });

  // Data Loading with fallback
  async function loadData() {
    try {
      const narRes = await fetch('data/narratives.json');
      if (!narRes.ok) throw new Error('Failed loading narratives');
      state.narratives = await narRes.json();
    } catch (e) {
      console.warn('Using fallback narratives data:', e);
      state.narratives = FALLBACK_NARRATIVES;
    }

    try {
      const sigRes = await fetch('data/signals.json');
      if (!sigRes.ok) throw new Error('Failed loading signals');
      state.signals = await sigRes.json();
    } catch (e) {
      console.warn('Using fallback signals data:', e);
      state.signals = FALLBACK_SIGNALS;
    }
  }

  // Navigation Logic
  function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = document.getElementById(targetTab);
        if (content) content.classList.add('active');
        state.activeTab = targetTab;

        if (targetTab === 'tab-analytics') {
          renderAnalyticsCharts();
        } else if (targetTab === 'tab-api') {
          renderApiInspector();
        }
      });
    });
  }

  // Search & Filter Setup
  function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const categoryChips = document.getElementById('category-chips');
    const sortSelect = document.getElementById('sort-select');

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
      renderNarrativesGrid();
    });

    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      btnClearSearch.style.display = 'none';
      renderNarrativesGrid();
    });

    categoryChips.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip')) {
        categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        state.selectedCategory = e.target.dataset.category;
        renderNarrativesGrid();
      }
    });

    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderNarrativesGrid();
    });
  }

  // Core Render
  function renderAll() {
    renderKPIs();
    renderNarrativesGrid();
    renderWidgets();
  }

  function renderKPIs() {
    if (!state.signals) return;
    document.getElementById('kpi-narratives').textContent = `${state.narratives.length} Active`;
    document.getElementById('kpi-momentum').textContent = `${state.signals.avgMomentumScore} / 100`;
    document.getElementById('kpi-sources').textContent = `${state.signals.signalSourcesCount.toLocaleString()} Feeders`;
  }

  // Render Filtered & Sorted Narratives Grid
  function renderNarrativesGrid() {
    const grid = document.getElementById('narratives-grid');
    grid.innerHTML = '';

    let items = [...state.narratives];

    // Category Filter
    if (state.selectedCategory !== 'all') {
      items = items.filter(n => n.category === state.selectedCategory);
    }

    // Search Filter
    if (state.searchQuery) {
      const q = state.searchQuery;
      items = items.filter(n => 
        n.title.toLowerCase().includes(q) ||
        n.subtitle.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.buildIdeas.some(i => i.title.toLowerCase().includes(q) || i.targetStack.toLowerCase().includes(q))
      );
    }

    // Sorting
    items.sort((a, b) => {
      if (state.sortBy === 'momentum-desc') return b.momentumScore - a.momentumScore;
      if (state.sortBy === 'velocity-desc') return b.signals.githubVelocity - a.signals.githubVelocity;
      if (state.sortBy === 'sentiment-desc') return b.signals.kolSentiment - a.signals.kolSentiment;
      if (state.sortBy === 'change-desc') return b.changePercent - a.changePercent;
      if (state.sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });

    document.getElementById('results-count').textContent = `Showing ${items.length} of ${state.narratives.length} narratives`;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3>No matching Solana narratives found</h3>
          <p>Try broadening your search criteria or choosing 'All Categories'.</p>
        </div>
      `;
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'narrative-card';

      card.innerHTML = `
        <div>
          <div class="card-top">
            <div>
              <span class="category-tag">${escapeHtml(item.category)}</span>
              <h3 class="card-title">${escapeHtml(item.title)}</h3>
              <p class="card-subtitle">${escapeHtml(item.subtitle)}</p>
            </div>
            <div class="momentum-badge" title="Fortnightly Momentum Score">
              <span class="momentum-num">${item.momentumScore}</span>
              <span class="momentum-lbl">Score</span>
            </div>
          </div>

          <p class="card-desc" style="margin-top: 14px;">${escapeHtml(item.description)}</p>
        </div>

        <div class="signals-box">
          <div class="signal-row">
            <div class="signal-label-group">
              <span>GitHub Velocity</span>
              <span class="pill-purple">${item.signals.githubVelocity}%</span>
            </div>
            <div class="signal-bar-track">
              <div class="signal-bar-fill fill-purple" style="width: ${item.signals.githubVelocity}%"></div>
            </div>
          </div>

          <div class="signal-row">
            <div class="signal-label-group">
              <span>On-Chain Spikes</span>
              <span class="pill-green">${item.signals.onchainSpikes}%</span>
            </div>
            <div class="signal-bar-track">
              <div class="signal-bar-fill fill-green" style="width: ${item.signals.onchainSpikes}%"></div>
            </div>
          </div>

          <div class="signal-row">
            <div class="signal-label-group">
              <span>KOL Social Sentiment</span>
              <span class="pill-cyan">${item.signals.kolSentiment}%</span>
            </div>
            <div class="signal-bar-track">
              <div class="signal-bar-fill fill-cyan" style="width: ${item.signals.kolSentiment}%"></div>
            </div>
          </div>
        </div>

        <div class="card-tags">
          ${item.tags.map(t => `<span class="tag-item">#${escapeHtml(t)}</span>`).join('')}
        </div>

        <div class="card-footer">
          <div class="vol-info">
            <span class="vol-val">${escapeHtml(item.fortnightlyVolume)} <span class="trend-up">(+${item.changePercent}%)</span></span>
            <span class="vol-lbl">2W Ecosystem Volume</span>
          </div>
          <button class="btn-primary btn-open-modal" data-id="${item.id}">
            💡 Build Ideas (${item.buildIdeas.length})
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach modal open handlers
    grid.querySelectorAll('.btn-open-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openModal(id);
      });
    });
  }

  // Build Ideas Modal Logic
  function initModalEvents() {
    const modal = document.getElementById('idea-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function openModal(narrativeId) {
    const narrative = state.narratives.find(n => n.id === narrativeId);
    if (!narrative) return;

    state.selectedNarrativeForModal = narrative;

    document.getElementById('modal-category').textContent = narrative.category;
    document.getElementById('modal-title').textContent = narrative.title;
    document.getElementById('modal-subtitle').textContent = narrative.subtitle;
    document.getElementById('modal-momentum').textContent = `${narrative.momentumScore}/100`;
    document.getElementById('modal-volume').textContent = narrative.fortnightlyVolume;
    document.getElementById('modal-growth').textContent = `+${narrative.changePercent}%`;

    const accordion = document.getElementById('ideas-accordion');
    accordion.innerHTML = '';

    narrative.buildIdeas.forEach((idea, idx) => {
      const compClass = idea.complexity.toLowerCase() === 'high' ? 'comp-high' : 
                        idea.complexity.toLowerCase() === 'medium' ? 'comp-medium' : 'comp-low';

      const card = document.createElement('div');
      card.className = 'idea-card';
      card.innerHTML = `
        <div class="idea-title-row">
          <h4 class="idea-title">${idx + 1}. ${escapeHtml(idea.title)}</h4>
          <span class="complexity-badge ${compClass}">${escapeHtml(idea.complexity)} Scope</span>
        </div>
        <p class="idea-desc">${escapeHtml(idea.description)}</p>

        <div class="idea-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Target Stack</span>
            <span class="meta-val">${escapeHtml(idea.targetStack)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Est. Timeframe</span>
            <span class="meta-val">${escapeHtml(idea.estTime)}</span>
          </div>
          <div class="meta-item" style="grid-column: 1 / -1;">
            <span class="meta-label">Monetization Model</span>
            <span class="meta-val">${escapeHtml(idea.revenueModel)}</span>
          </div>
        </div>

        <div class="code-prompt-box">
          <div class="code-prompt-header">
            <span>⚡ AI Engineering Prompt Directive</span>
            <button class="btn-secondary btn-sm btn-copy-prompt" data-prompt="${escapeHtml(idea.prompt)}">
              📋 Copy Prompt
            </button>
          </div>
          <div class="code-prompt-text">${escapeHtml(idea.prompt)}</div>
        </div>
      `;
      accordion.appendChild(card);
    });

    accordion.querySelectorAll('.btn-copy-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const promptText = e.currentTarget.dataset.prompt;
        copyToClipboard(promptText, 'Engineering Prompt copied to clipboard!');
      });
    });

    const modal = document.getElementById('idea-modal');
    modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('idea-modal');
    modal.classList.remove('active');
  }

  // Analytics & Chart.js Rendering
  function renderAnalyticsCharts() {
    if (!window.Chart || !state.narratives || !state.signals) return;

    renderMatrixChart();
    renderTrendChart();
  }

  function renderMatrixChart() {
    const ctx = document.getElementById('chart-signals-matrix').getContext('2d');

    const labels = state.narratives.map(n => n.title.split(' ')[0] + ' ' + (n.title.split(' ')[1] || ''));
    const githubData = state.narratives.map(n => n.signals.githubVelocity);
    const onchainData = state.narratives.map(n => n.signals.onchainSpikes);
    const sentimentData = state.narratives.map(n => n.signals.kolSentiment);

    if (state.matrixChartInstance) {
      state.matrixChartInstance.destroy();
    }

    const chartButtons = document.querySelectorAll('.chart-controls .chart-btn');
    chartButtons.forEach(btn => {
      btn.onclick = () => {
        chartButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.matrixChartType = btn.dataset.chartType;
        renderMatrixChart();
      };
    });

    const type = state.matrixChartType;

    state.matrixChartInstance = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'GitHub Velocity',
            data: githubData,
            backgroundColor: 'rgba(153, 69, 255, 0.65)',
            borderColor: '#9945FF',
            borderWidth: 2
          },
          {
            label: 'On-Chain Spikes',
            data: onchainData,
            backgroundColor: 'rgba(20, 241, 149, 0.65)',
            borderColor: '#14F195',
            borderWidth: 2
          },
          {
            label: 'KOL Sentiment',
            data: sentimentData,
            backgroundColor: 'rgba(0, 194, 255, 0.65)',
            borderColor: '#00C2FF',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#F0F4FD', font: { family: 'Plus Jakarta Sans', size: 12 } }
          }
        },
        scales: type === 'bar' ? {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' }, max: 100 }
        } : {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#94A3B8' },
            ticks: { display: false, max: 100 }
          }
        }
      }
    });
  }

  function renderTrendChart() {
    const ctx = document.getElementById('chart-fortnightly-trend').getContext('2d');
    const history = state.signals.fortnightlyHistory;

    const fortnights = history.map(h => h.fortnight);

    if (state.trendChartInstance) {
      state.trendChartInstance.destroy();
    }

    state.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fortnights,
        datasets: [
          { label: 'DeFAI Agents', data: history.map(h => h.defai), borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.1)', fill: true, tension: 0.35 },
          { label: 'DePIN Compute', data: history.map(h => h.depin), borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.1)', fill: true, tension: 0.35 },
          { label: 'Blinks 2.0', data: history.map(h => h.blinks), borderColor: '#00C2FF', backgroundColor: 'rgba(0,194,255,0.1)', fill: true, tension: 0.35 },
          { label: 'x402 Micro-pay', data: history.map(h => h.micropay), borderColor: '#FFB800', backgroundColor: 'rgba(255,184,0,0.1)', fill: true, tension: 0.35 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#F0F4FD', font: { family: 'Plus Jakarta Sans', size: 12 } } }
        },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  function renderWidgets() {
    if (!state.signals) return;

    const contractsContainer = document.getElementById('contracts-list');
    contractsContainer.innerHTML = state.signals.topContracts.map(c => `
      <div class="contract-item">
        <div class="contract-info">
          <span class="contract-label">${escapeHtml(c.label)}</span>
          <span class="contract-name">${escapeHtml(c.name)}</span>
        </div>
        <div class="contract-stats">
          <span>${escapeHtml(c.calls24h)}</span>
          <span class="growth-badge">${escapeHtml(c.growth)}</span>
        </div>
      </div>
    `).join('');

    const kolContainer = document.getElementById('kol-feed');
    kolContainer.innerHTML = state.signals.topKOLSignals.map(k => `
      <div class="kol-card">
        <div class="kol-header">
          <span class="kol-author">${escapeHtml(k.author)}</span>
          <span class="kol-role">${escapeHtml(k.role)}</span>
        </div>
        <p class="kol-quote">"${escapeHtml(k.quote)}"</p>
        <div class="kol-footer">
          <span>${escapeHtml(k.engagement)}</span>
          <span class="pill-cyan">Sentiment: ${k.sentiment}%</span>
        </div>
      </div>
    `).join('');
  }

  // AI Idea Synthesis Logic
  function initSynthesizerEvents() {
    const btnGenerate = document.getElementById('btn-generate-spec');
    const btnCopy = document.getElementById('btn-copy-spec');
    const btnDownload = document.getElementById('btn-download-spec');

    btnGenerate.addEventListener('click', runSynthesis);

    btnCopy.addEventListener('click', () => {
      const markdown = document.getElementById('spec-display').dataset.rawMarkdown || '';
      if (markdown) {
        copyToClipboard(markdown, 'Generated Build Spec copied as Markdown!');
      }
    });

    btnDownload.addEventListener('click', () => {
      const markdown = document.getElementById('spec-display').dataset.rawMarkdown || '';
      if (markdown) {
        downloadFile('solpulse_build_spec.md', markdown, 'text/markdown');
        showToast('Spec file solpulse_build_spec.md downloaded!');
      }
    });
  }

  async function runSynthesis() {
    const narrativeVal = document.getElementById('synth-narrative').value;
    const stackVal = document.getElementById('synth-stack').value;
    const scopeVal = document.getElementById('synth-complexity').value;
    const revVal = document.getElementById('synth-revenue').value;
    const customHint = document.getElementById('synth-prompt-hint').value.trim();

    let targetNar = state.narratives[0];
    if (narrativeVal !== 'auto') {
      targetNar = state.narratives.find(n => n.id === narrativeVal) || state.narratives[0];
    }

    const badge = document.getElementById('spec-status-badge');
    const termLog = document.getElementById('terminal-log');
    const display = document.getElementById('spec-display');
    const actions = document.getElementById('output-actions');

    badge.className = 'spec-status-badge badge-generating';
    badge.textContent = '⚡ Synthesizing AI Model...';
    termLog.style.display = 'flex';
    termLog.innerHTML = '';
    actions.style.display = 'none';

    const logSteps = [
      `Initializing SolPulse Agent Core v2.4...`,
      `Pulling real-time RPC metrics for ${targetNar.title}...`,
      `Evaluating high-velocity DEX routes & program state compression...`,
      `Formulating Anchor Rust smart contract blueprint & client interface...`,
      `Generating monetization wrappers (${revVal})...`,
      `Finalizing architecture markdown payload...`
    ];

    for (let step of logSteps) {
      const timeStr = new Date().toLocaleTimeString();
      const line = document.createElement('div');
      line.className = 'log-line';
      line.innerHTML = `<span class="log-time">[${timeStr}]</span> <span>${escapeHtml(step)}</span>`;
      termLog.appendChild(line);
      termLog.scrollTop = termLog.scrollHeight;
      await new Promise(r => setTimeout(r, 260));
    }

    // Build synthesized markdown spec
    const projectTitle = `${targetNar.title.split(' ')[0]} AI Protocol - ${scopeVal.split(' ')[0]}`;
    const generatedMarkdown = `# ${projectTitle}
> **Generated by SolPulse AI Engine • ${state.signals ? state.signals.cyclePeriod : 'Fortnight 16'}**

## 1. Executive Summary & Market Narrative
* **Target Narrative**: ${targetNar.title}
* **Category**: ${targetNar.category}
* **Momentum Score**: ${targetNar.momentumScore}/100 (GitHub Velocity: ${targetNar.signals.githubVelocity}%)
* **Scope Strategy**: ${scopeVal}
* **Stack Selected**: ${stackVal}

## 2. Core Architecture Blueprint
This application leverages Solana's High Throughput SVM architecture to combine ${targetNar.category} primitives with zero-latency state updates.

### Key Smart Contract Modules (Anchor / Rust)
1. **State Vault Manager**: Manages delegated wallet state, emergency circuit breakers, and rate limits.
2. **Execution Engine**: Intersects with Jupiter DEX routing and ${stackVal} primitives.
3. **Monetization Engine**: Automatically routes fees via **${revVal}**.

${customHint ? `### Custom User Directives Incorporated\n* "${customHint}"\n` : ''}

## 3. Recommended Build Milestones
* **Phase 1 (Days 1-4)**: Anchor Program development, account initialization test suites (`anchor test`).
* **Phase 2 (Days 5-9)**: Next.js + Web3.js v2 frontend integration, Helius WebSocket RPC subscription listener.
* **Phase 3 (Days 10-14)**: Security simulation tests, mainnet-beta preview deployment & Blink action endpoints.

## 4. LLM Engineering Prompt (Ready for Claude / Copilot)
\`\`\`rust
// Anchor Rust Program Blueprint
use anchor_lang::prelude::*;

declare_id!("SolPulse11111111111111111111111111111111111111");

#[program]
pub mod solpulse_agent_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, daily_cap: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.daily_cap = daily_cap;
        vault.last_spent = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[account]
pub struct AgentVault {
    pub authority: Pubkey,
    pub daily_cap: u64,
    pub last_spent: i64,
}
\`\`\`
`;

    // Render formatted markdown
    display.dataset.rawMarkdown = generatedMarkdown;
    display.innerHTML = formatMarkdown(generatedMarkdown);

    badge.className = 'spec-status-badge badge-ready';
    badge.textContent = '✓ Spec Generated';
    actions.style.display = 'flex';
  }

  // Simple Markdown Formatter Helper
  function formatMarkdown(md) {
    let html = md
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--sol-cyan); padding-left: 10px; color: var(--text-secondary);">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `
          <div class="code-prompt-box">
            <div class="code-prompt-header">
              <span>Code Spec (${lang || 'text'})</span>
            </div>
            <div class="code-prompt-text">${escapeHtml(code)}</div>
          </div>
        `;
      });

    return `<div class="spec-content">${html}</div>`;
  }

  // Data Inspector / API Tab
  function initApiInspectorEvents() {
    const tabs = document.querySelectorAll('.api-tab');
    const search = document.getElementById('api-search');
    const btnCopy = document.getElementById('btn-copy-json');
    const btnDownload = document.getElementById('btn-download-json');

    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        state.apiDataset = t.dataset.dataset;
        renderApiInspector();
      });
    });

    search.addEventListener('input', (e) => {
      state.apiSearchQuery = e.target.value.toLowerCase().trim();
      renderApiInspector();
    });

    btnCopy.addEventListener('click', () => {
      const content = document.getElementById('json-display-code').textContent;
      copyToClipboard(content, `JSON Payload (${state.apiDataset}.json) copied!`);
    });

    btnDownload.addEventListener('click', () => {
      const dataObj = state.apiDataset === 'narratives' ? state.narratives : state.signals;
      const jsonStr = JSON.stringify(dataObj, null, 2);
      downloadFile(`${state.apiDataset}.json`, jsonStr, 'application/json');
      showToast(`Downloaded ${state.apiDataset}.json!`);
    });
  }

  function renderApiInspector() {
    const codeElem = document.getElementById('json-display-code');
    const dataObj = state.apiDataset === 'narratives' ? state.narratives : state.signals;

    let displayObj = dataObj;

    if (state.apiSearchQuery && Array.isArray(dataObj)) {
      displayObj = dataObj.filter(item => 
        JSON.stringify(item).toLowerCase().includes(state.apiSearchQuery)
      );
    }

    codeElem.textContent = JSON.stringify(displayObj, null, 2);
  }

  // Utility Functions
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function copyToClipboard(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✓</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

})();
