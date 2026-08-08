/**
 * SolPulse AI - Entry Point Script
 * engine/runEngine.js
 *
 * Runs the automated signal detection and ranking engine:
 * 1. Reads narratives from data/narratives.json
 * 2. Fetches live GitHub API metrics & Solana ecosystem telemetry via signalFetcher.js
 * 3. Calculates weighted Narrative Momentum Scores (NMS = 0.4 * GitHub + 0.35 * OnChain + 0.25 * Social)
 * 4. Saves generated signal metrics to data/signals.json
 */

const fs = require('fs');
const path = require('path');
const { fetchAllSignals } = require('./signalFetcher');

const NARRATIVES_PATH = path.join(__dirname, '..', 'data', 'narratives.json');
const SIGNALS_PATH = path.join(__dirname, '..', 'data', 'signals.json');

async function run() {
  console.log('===========================================================');
  console.log('⚡ SolPulse AI Engine - Automated Signal Detection & Ranking');
  console.log('===========================================================');
  console.log(`[1/4] Loading narrative database from: ${NARRATIVES_PATH}`);

  let narrativesRaw = [];
  try {
    const fileData = fs.readFileSync(NARRATIVES_PATH, 'utf8');
    const parsed = JSON.parse(fileData);
    if (Array.isArray(parsed)) {
      narrativesRaw = parsed;
    } else if (parsed.narratives && Array.isArray(parsed.narratives)) {
      narrativesRaw = parsed.narratives;
    }
    console.log(`✓ Loaded ${narrativesRaw.length} narratives successfully.`);
  } catch (err) {
    console.error(`✗ Error reading narratives.json: ${err.message}`);
    process.exit(1);
  }

  console.log('[2/4] Executing signalFetcher API requests & metric weighting...');
  const startTime = Date.now();

  try {
    const signalsData = await fetchAllSignals(narrativesRaw);
    const elapsed = Date.now() - startTime;

    console.log(`✓ Signal processing completed in ${elapsed}ms.`);
    console.log(`  - Total Narratives Analyzed: ${signalsData.totalNarratives}`);
    console.log(`  - Average Narrative Momentum Score (NMS): ${signalsData.avgMomentumScore} / 100`);
    console.log(`  - Signal Sources Aggregated: ${signalsData.signalSourcesCount} feeders`);

    console.log('[3/4] Calculated Narrative Momentum Breakdown:');
    signalsData.narrativeScores.forEach((n, idx) => {
      console.log(`  ${idx + 1}. [NMS: ${n.momentumScore}] ${n.title}`);
      console.log(`     -> GitHub: ${n.signals.githubVelocity}% | OnChain: ${n.signals.onchainSpikes}% | Social: ${n.signals.kolSentiment}%`);
    });

    console.log(`[4/4] Writing computed signals to: ${SIGNALS_PATH}`);
    // Ensure parent directory exists
    const dataDir = path.dirname(SIGNALS_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(SIGNALS_PATH, JSON.stringify(signalsData, null, 2), 'utf8');
    console.log('✓ Successfully saved updated signals.json!');
    console.log('===========================================================');
  } catch (err) {
    console.error(`✗ Error running signal engine: ${err.stack || err.message}`);
    process.exit(1);
  }
}

run();
