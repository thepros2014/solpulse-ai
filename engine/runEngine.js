/**
 * SolPulse AI - Entry Point Script
 * engine/runEngine.js
 *
 * Runs the automated signal detection and ranking engine:
 * 1. Reads narratives from data/narratives.json
 * 2. Fetches live GitHub API metrics & Helius on-chain telemetry via signalFetcher.js
 * 3. Calculates weighted Narrative Momentum Scores (NMS = 0.4*GitHub + 0.35*OnChain + 0.25*Social)
 * 4. Prints [LIVE] or [MOCK] next to each data point
 * 5. Saves generated signal metrics to data/signals.json
 * 6. Saves engine metadata to data/engine_meta.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { fetchAllSignals } = require('./signalFetcher');

const NARRATIVES_PATH  = path.join(__dirname, '..', 'data', 'narratives.json');
const SIGNALS_PATH     = path.join(__dirname, '..', 'data', 'signals.json');
const ENGINE_META_PATH = path.join(__dirname, '..', 'data', 'engine_meta.json');

// ANSI colour helpers (works on most modern terminals)
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m'
};

function tag(str) {
  return str === '[LIVE]'
    ? C.green + '[LIVE]' + C.reset
    : C.yellow + '[MOCK]' + C.reset;
}

async function run() {
  console.log(C.bold + '==============================================================' + C.reset);
  console.log(C.bold + C.cyan + '⚡ SolPulse AI Engine - Live Signal Detection & Ranking v2' + C.reset);
  console.log(C.bold + '==============================================================' + C.reset);
  console.log(C.gray + '  On-chain: Helius public RPC  |  GitHub: REST API v3' + C.reset);
  console.log('');

  // ── Step 1: Load narratives ──────────────────────────────────────────────
  console.log('[1/5] Loading narrative database from: ' + NARRATIVES_PATH);

  let narrativesRaw = [];
  try {
    const fileData = fs.readFileSync(NARRATIVES_PATH, 'utf8');
    const parsed = JSON.parse(fileData);
    if (Array.isArray(parsed)) {
      narrativesRaw = parsed;
    } else if (parsed.narratives && Array.isArray(parsed.narratives)) {
      narrativesRaw = parsed.narratives;
    }
    console.log(C.green + '  \u2713 Loaded ' + narrativesRaw.length + ' narratives successfully.' + C.reset);
  } catch (err) {
    console.error(C.red + '  \u2717 Error reading narratives.json: ' + err.message + C.reset);
    process.exit(1);
  }

  // ── Step 2: Execute signal engine ───────────────────────────────────────
  console.log('[2/5] Executing signalFetcher: Helius RPC calls + GitHub API queries...');
  const startTime = Date.now();

  let signalsData;
  try {
    signalsData = await fetchAllSignals(narrativesRaw);
  } catch (err) {
    console.error(C.red + '  \u2717 Error running signal engine: ' + (err.stack || err.message) + C.reset);
    process.exit(1);
  }

  const elapsed = Date.now() - startTime;
  console.log(C.green + '  \u2713 Signal processing completed in ' + elapsed + 'ms.' + C.reset);
  console.log('     Avg NMS: ' + C.bold + signalsData.avgMomentumScore + C.reset + ' / 100');
  console.log('     TPS ' + tag(signalsData.heliusNetworkStats.dataTag) + ': ' + signalsData.heliusNetworkStats.tps + ' tx/s  (slot #' + signalsData.heliusNetworkStats.slotHeight + ')');
  console.log('');

  // ── Step 3: Print per-narrative breakdown with LIVE/MOCK labels ──────────
  console.log('[3/5] Narrative Momentum Breakdown (NMS = 0.4*GitHub + 0.35*OnChain + 0.25*Social):');
  signalsData.narrativeScores.forEach(function(n, idx) {
    const s = n.dataSourceStatus;
    const sigInfo = s.onchain === '[LIVE]' ? ' (' + s.recentSigCount + ' recent sigs)' : '';
    const commits = n.repoTelemetry && n.repoTelemetry.length > 0
      ? n.repoTelemetry.map(function(r) { return r.commitLive ? (r.recentCommits + ' commits') : ''; }).filter(Boolean).join(', ')
      : '';

    console.log('');
    console.log('  ' + (idx + 1) + '. ' + C.bold + '[NMS: ' + n.momentumScore + '] ' + n.title + C.reset);
    console.log('     GitHub  ' + tag(s.github)  + ': score=' + n.signals.githubVelocity  + (commits ? ' | real commits: ' + commits : ''));
    console.log('     OnChain ' + tag(s.onchain) + ': score=' + n.signals.onchainSpikes + sigInfo);
    console.log('     Social  ' + tag(s.social)  + ': score=' + n.signals.kolSentiment);
  });
  console.log('');

  // ── Step 4: Print top contracts ──────────────────────────────────────────
  console.log('[4/5] Top On-Chain Program Activity (Helius RPC getSignaturesForAddress):');
  signalsData.topContracts.forEach(function(c) {
    const sigDisplay = c.recentSigs !== null ? c.recentSigs + ' recent sigs' : 'fallback data';
    console.log('  ' + tag(c.dataTag) + ' ' + c.label + ': ' + sigDisplay);
    console.log('         ' + C.gray + c.address + C.reset);
  });
  console.log('');

  // ── Step 5: Write output files ───────────────────────────────────────────
  console.log('[5/5] Writing output files...');

  const dataDir = path.dirname(SIGNALS_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // signals.json
  fs.writeFileSync(SIGNALS_PATH, JSON.stringify(signalsData, null, 2), 'utf8');
  console.log(C.green + '  \u2713 Saved data/signals.json' + C.reset);

  // engine_meta.json
  const liveSources = [];
  const mockSources = [];
  signalsData.narrativeScores.forEach(function(n) {
    const s = n.dataSourceStatus;
    const base = n.narrativeId;
    if (s.github  === '[LIVE]') liveSources.push(base + ':github');  else mockSources.push(base + ':github');
    if (s.onchain === '[LIVE]') liveSources.push(base + ':onchain'); else mockSources.push(base + ':onchain');
    if (s.social  === '[LIVE]') liveSources.push(base + ':social');  else mockSources.push(base + ':social');
  });
  if (signalsData.heliusNetworkStats.dataTag === '[LIVE]') liveSources.push('helius:tps');
  else mockSources.push('helius:tps');

  const totalPts = liveSources.length + mockSources.length;
  const engineMeta = {
    lastRunAt: new Date().toISOString(),
    elapsedMs: elapsed,
    totalNarratives: signalsData.totalNarratives,
    avgMomentumScore: signalsData.avgMomentumScore,
    liveCoveragePercent: signalsData.liveCoveragePercent,
    totalDataPoints: totalPts,
    liveDataPoints: liveSources.length,
    mockDataPoints: mockSources.length,
    liveDataSources: liveSources,
    mockDataSources: mockSources,
    heliusTps: signalsData.heliusNetworkStats.tps,
    heliusTpsLive: signalsData.heliusNetworkStats.dataTag === '[LIVE]',
    heliusSlotHeight: signalsData.heliusNetworkStats.slotHeight,
    rpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=demo'
  };

  fs.writeFileSync(ENGINE_META_PATH, JSON.stringify(engineMeta, null, 2), 'utf8');
  console.log(C.green + '  \u2713 Saved data/engine_meta.json' + C.reset);

  console.log('');
  console.log(C.bold + '==============================================================' + C.reset);
  console.log(C.bold + '  Live Data Coverage: ' + C.green + signalsData.liveCoveragePercent + '%' + C.reset + C.bold + ' (' + liveSources.length + '/' + totalPts + ' data points live)' + C.reset);
  console.log(C.bold + '==============================================================' + C.reset);
}

run();
