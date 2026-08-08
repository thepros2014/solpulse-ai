/**
 * SolPulse AI - Signal Engine Scheduler
 * engine/scheduler.js
 *
 * Standalone scheduler that re-runs the full signal engine every 6 hours
 * and appends results to data/history/signals_YYYY-MM-DD.json for
 * historical time-series tracking (charts, trend analysis).
 *
 * Usage:
 *   node engine/scheduler.js
 *
 * The process stays alive and logs each run. Press Ctrl+C to stop.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { fetchAllSignals } = require('./signalFetcher');

const NARRATIVES_PATH = path.join(__dirname, '..', 'data', 'narratives.json');
const SIGNALS_PATH    = path.join(__dirname, '..', 'data', 'signals.json');
const HISTORY_DIR     = path.join(__dirname, '..', 'data', 'history');
const ENGINE_META_PATH = path.join(__dirname, '..', 'data', 'engine_meta.json');

/** How often to re-run the engine (6 hours in milliseconds) */
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────
// Helper: zero-pad a number to 2 digits
// ─────────────────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, '0'); }

/**
 * Format a Date as YYYY-MM-DD (local time)
 * @param {Date} d
 * @returns {string}
 */
function dateString(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

// ─────────────────────────────────────────────────────────────────
// Load narratives (cached at startup – reload each run for freshness)
// ─────────────────────────────────────────────────────────────────
function loadNarratives() {
  const fileData = fs.readFileSync(NARRATIVES_PATH, 'utf8');
  const parsed = JSON.parse(fileData);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.narratives && Array.isArray(parsed.narratives)) return parsed.narratives;
  return [];
}

// ─────────────────────────────────────────────────────────────────
// Single engine run + persistence
// ─────────────────────────────────────────────────────────────────
async function runOnce(runIndex) {
  const runStart = new Date();
  const label = '[Scheduler Run #' + runIndex + ' @ ' + runStart.toISOString() + ']';
  console.log('\n' + '='.repeat(70));
  console.log(label);
  console.log('='.repeat(70));

  // Load narratives fresh on each run (picks up any edits to narratives.json)
  let narratives;
  try {
    narratives = loadNarratives();
    console.log('  Loaded ' + narratives.length + ' narratives.');
  } catch (err) {
    console.error('  ERROR loading narratives: ' + err.message);
    return;
  }

  const startTime = Date.now();
  let signalsData;
  try {
    signalsData = await fetchAllSignals(narratives);
  } catch (err) {
    console.error('  ERROR in fetchAllSignals: ' + (err.stack || err.message));
    return;
  }

  const elapsed = Date.now() - startTime;
  console.log('  Completed in ' + elapsed + 'ms | Avg NMS: ' + signalsData.avgMomentumScore + ' | Live coverage: ' + signalsData.liveCoveragePercent + '%');
  console.log('  TPS ' + signalsData.heliusNetworkStats.dataTag + ': ' + signalsData.heliusNetworkStats.tps + ' tx/s');

  // ── Write/overwrite data/signals.json ──────────────────────────
  const dataDir = path.dirname(SIGNALS_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(SIGNALS_PATH, JSON.stringify(signalsData, null, 2), 'utf8');
  console.log('  Wrote data/signals.json');

  // ── Write data/engine_meta.json ────────────────────────────────
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
    lastRunAt: runStart.toISOString(),
    elapsedMs: elapsed,
    schedulerRunIndex: runIndex,
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
    rpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=demo',
    nextRunAt: new Date(runStart.getTime() + RUN_INTERVAL_MS).toISOString()
  };
  fs.writeFileSync(ENGINE_META_PATH, JSON.stringify(engineMeta, null, 2), 'utf8');
  console.log('  Wrote data/engine_meta.json');

  // ── Append to daily history file ───────────────────────────────
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });

  const historyFile = path.join(HISTORY_DIR, 'signals_' + dateString(runStart) + '.json');

  // Each daily file is an array of run snapshots
  let historyArray = [];
  if (fs.existsSync(historyFile)) {
    try {
      historyArray = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      if (!Array.isArray(historyArray)) historyArray = [];
    } catch (e) {
      historyArray = [];
    }
  }

  // Build a compact snapshot suitable for time-series charts
  const snapshot = {
    timestamp: runStart.toISOString(),
    schedulerRunIndex: runIndex,
    elapsedMs: elapsed,
    avgMomentumScore: signalsData.avgMomentumScore,
    liveCoveragePercent: signalsData.liveCoveragePercent,
    heliusTps: signalsData.heliusNetworkStats.tps,
    heliusSlotHeight: signalsData.heliusNetworkStats.slotHeight,
    heliusTpsLive: signalsData.heliusNetworkStats.dataTag === '[LIVE]',
    narratives: signalsData.narrativeScores.map(function(n) {
      return {
        id: n.narrativeId,
        title: n.title,
        nms: n.momentumScore,
        github: n.signals.githubVelocity,
        onchain: n.signals.onchainSpikes,
        social: n.signals.kolSentiment,
        githubLive: n.dataSourceStatus.github  === '[LIVE]',
        onchainLive: n.dataSourceStatus.onchain === '[LIVE]',
        recentSigCount: n.dataSourceStatus.recentSigCount
      };
    }),
    topContracts: signalsData.topContracts
  };

  historyArray.push(snapshot);
  fs.writeFileSync(historyFile, JSON.stringify(historyArray, null, 2), 'utf8');
  console.log('  Appended snapshot to data/history/' + path.basename(historyFile) + ' (' + historyArray.length + ' entries today)');
  console.log('  Next run in 6 hours at: ' + engineMeta.nextRunAt);
}

// ─────────────────────────────────────────────────────────────────
// Scheduler loop
// ─────────────────────────────────────────────────────────────────
async function startScheduler() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║   SolPulse AI Signal Scheduler  –  runs every 6 hours   ║');
  console.log('  ║   Press Ctrl+C to stop.                                  ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');

  let runIndex = 0;

  // Run immediately on start, then on interval
  async function tick() {
    runIndex++;
    try {
      await runOnce(runIndex);
    } catch (err) {
      console.error('Unhandled error in scheduler run #' + runIndex + ': ' + (err.stack || err.message));
    }
  }

  await tick();
  setInterval(tick, RUN_INTERVAL_MS);
}

startScheduler();
