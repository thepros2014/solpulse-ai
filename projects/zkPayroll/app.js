/**
 * zkPayroll Solana — Core Web Application Logic
 * Powered by Light Protocol ZK Compression & Solana Syscall Verifier Simulation
 */

// Global State
const appState = {
  walletConnected: false,
  walletAddress: null,
  network: 'devnet',
  simMode: true,
  payrollData: [], // Array of recipient objects
  historyData: [
    {
      id: 'ZK-84920',
      timestamp: '2026-08-07 18:45',
      count: 12,
      totalAmount: 48500.00,
      merkleRoot: '0x7d2f9b8c3e1a4d92f8b5c1a7e3d92b4a1f',
      txSignature: '4Zp8k9L2mQ7vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v',
      status: 'Finalized'
    },
    {
      id: 'ZK-84919',
      timestamp: '2026-08-01 10:15',
      count: 8,
      totalAmount: 32000.00,
      merkleRoot: '0x3e1a7c4f8b2d1e9f4a7c2b5d8e1f3a6b',
      txSignature: '3Xm9p2K1jF5wR5t8k9P3mF8wL2vX7n1k9P3mF8wL2v',
      status: 'Finalized'
    }
  ],
  isExecuting: false,
  chartInstance: null,
  currentChartType: 'dept',
  merkleTreeDepth: 26,
  vaultBalanceUSDC: 185400.00
};

// Initial Sample Recipients Data
const sampleRecipients = [
  { id: '1', address: '7Xg2kP9mQ4vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A', role: 'Engineering', amount: 8500.00, shielded: true, status: 'Ready' },
  { id: '2', address: '3M9fL2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8bC', role: 'Engineering', amount: 7800.00, shielded: true, status: 'Ready' },
  { id: '3', address: '9P3mF8wL2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v4D', role: 'Design', amount: 6200.00, shielded: true, status: 'Ready' },
  { id: '4', address: '5vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8bC7Xg2', role: 'Product', amount: 7000.00, shielded: true, status: 'Ready' },
  { id: '5', address: '2bC7Xg2kP9mQ4vX7n1k9P3mF8wL2vX7n1k9P3mF8', role: 'Marketing', amount: 5400.00, shielded: false, status: 'Ready' },
  { id: '6', address: '8F8wL2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8', role: 'Operations', amount: 4800.00, shielded: true, status: 'Ready' },
  { id: '7', address: '4n1k9P3mF8wL2vX7n1k9P3mF8wL2vX7n1k9P3mF', role: 'Engineering', amount: 9200.00, shielded: true, status: 'Ready' },
  { id: '8', address: '6L2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8bC', role: 'Executive', amount: 12000.00, shielded: true, status: 'Ready' },
  { id: '9', address: '1P3mF8wL2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL', role: 'Design', amount: 5900.00, shielded: false, status: 'Ready' },
  { id: '10', address: '0vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8bC7X', role: 'Engineering', amount: 8100.00, shielded: true, status: 'Ready' }
];

// Helper: Pseudo Poseidon Hash Generator
function generateLeafHash(address, amount, shielded) {
  const seed = `${address}-${amount}-${shielded}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}...${hex.slice(-4)}`;
}

// Helper: Generate Random Solana Tx Signature
function generateTxSig() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 44; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

// Helper: Format Currency
function formatUSDC(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) + ' USDC';
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initChart();
  logTerminal('info', '[SYSTEM] zkPayroll Solana client initialized.');
  logTerminal('info', '[ZK_SDK] Poseidon Hash Constants & Light Protocol State loaded.');
});

// Event Listeners Setup
function setupEventListeners() {
  // Wallet Connection
  document.getElementById('walletBtn').addEventListener('click', toggleWallet);

  // Network Selection
  document.getElementById('networkSelect').addEventListener('change', (e) => {
    appState.network = e.target.value;
    logTerminal('info', `[SOLANA] Network switched to: ${appState.network.toUpperCase()}`);
    showToast(`Switched network to ${appState.network.toUpperCase()}`, 'info');
  });

  // Mode Toggle
  document.getElementById('simModeToggle').addEventListener('change', (e) => {
    appState.simMode = e.target.checked;
    logTerminal('info', `[SIMULATION] Simulation mode ${appState.simMode ? 'Enabled' : 'Disabled'}`);
  });

  // CSV Drag & Drop & Upload
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('csvFileInput');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleCsvFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleCsvFile(e.target.files[0]);
    }
  });

  // Sample Data & CSV Template
  document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
  document.getElementById('downloadTemplateBtn').addEventListener('click', downloadCsvTemplate);

  // Table Toolbar
  document.getElementById('tableSearchInput').addEventListener('input', renderTable);
  document.getElementById('privacyFilter').addEventListener('change', renderTable);
  document.getElementById('clearTableBtn').addEventListener('click', clearTable);

  // Add Recipient Modal
  document.getElementById('addRecipientBtn').addEventListener('click', openAddRecipientModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  document.getElementById('recipientForm').addEventListener('submit', handleRecipientFormSubmit);

  // Console Actions
  document.getElementById('clearLogsBtn').addEventListener('click', clearTerminal);
  document.getElementById('copyLogsBtn').addEventListener('click', copyTerminalLogs);

  // Chart Switcher Tabs
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      appState.currentChartType = e.target.dataset.chart;
      updateChart();
    });
  });

  // Batch Payout 1-Click Execution
  document.getElementById('executeBatchBtn').addEventListener('click', executeBatchPayout);

  // Refresh History
  document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
    logTerminal('info', '[SOLANA_RPC] Querying account logs for program `zkP1ay...89xF`...');
    showToast('On-Chain Batch History Synced', 'success');
  });
}

// Wallet Connection Toggle
function toggleWallet() {
  const btn = document.getElementById('walletBtn');
  const btnText = document.getElementById('walletBtnText');

  if (!appState.walletConnected) {
    appState.walletConnected = true;
    appState.walletAddress = '7Xg2...kP9m';
    btnText.textContent = appState.walletAddress;
    btn.classList.add('connected');
    logTerminal('success', `[WALLET] Connected Phantom Wallet: ${appState.walletAddress} (Solana Mainnet/Devnet Keypair)`);
    showToast('Wallet Connected: 7Xg2...kP9m', 'success');
  } else {
    appState.walletConnected = false;
    appState.walletAddress = null;
    btnText.textContent = 'Connect Wallet';
    btn.classList.remove('connected');
    logTerminal('info', '[WALLET] Wallet Disconnected');
    showToast('Wallet Disconnected', 'info');
  }
}

// Load Sample Payroll Data
function loadSampleData() {
  appState.payrollData = JSON.parse(JSON.stringify(sampleRecipients));
  renderTable();
  updateMetrics();
  updateChart();
  updateWizardStep(2);
  logTerminal('success', `[PAYROLL] Loaded ${appState.payrollData.length} sample recipient records into editor.`);
  showToast(`Loaded ${appState.payrollData.length} sample recipients`, 'success');
}

// Download CSV Template
function downloadCsvTemplate() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Solana_Address,Amount_USDC,Department,ZK_Shielded\n"
    + "7Xg2kP9mQ4vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A,5000.00,Engineering,true\n"
    + "3M9fL2vX7n1k9P3mF8wL2vX7n1k9P3mF8wL2v9A8bC,4200.00,Design,true\n"
    + "2bC7Xg2kP9mQ4vX7n1k9P3mF8wL2vX7n1k9P3mF8,3800.00,Marketing,false\n";
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "zkPayroll_Solana_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  logTerminal('info', '[EXPORT] Downloaded payroll CSV template.');
}

// Handle CSV File Upload
function handleCsvFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a valid .csv file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    const parsed = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const address = parts[0].trim();
        const amount = parseFloat(parts[1].trim()) || 0;
        const role = parts[2] ? parts[2].trim() : 'Engineering';
        const shielded = parts[3] ? parts[3].trim().toLowerCase() === 'true' : true;

        if (address.length > 5 && amount > 0) {
          parsed.push({
            id: String(Date.now() + i),
            address,
            amount,
            role,
            shielded,
            status: 'Ready'
          });
        }
      }
    }

    if (parsed.length > 0) {
      appState.payrollData = parsed;
      renderTable();
      updateMetrics();
      updateChart();
      updateWizardStep(2);
      logTerminal('success', `[CSV_PARSER] Successfully parsed ${parsed.length} recipients from ${file.name}`);
      showToast(`Imported ${parsed.length} recipients from CSV`, 'success');
    } else {
      showToast('Could not parse any valid recipient rows from CSV', 'error');
    }
  };
  reader.readAsText(file);
}

// Render Payroll Table
function renderTable() {
  const tbody = document.getElementById('payrollTableBody');
  const search = document.getElementById('tableSearchInput').value.toLowerCase();
  const privacy = document.getElementById('privacyFilter').value;

  const filtered = appState.payrollData.filter(item => {
    const matchesSearch = item.address.toLowerCase().includes(search) || 
                          item.role.toLowerCase().includes(search) ||
                          item.amount.toString().includes(search);
    const matchesPrivacy = privacy === 'all' ? true : 
                           privacy === 'confidential' ? item.shielded : !item.shielded;
    return matchesSearch && matchesPrivacy;
  });

  document.getElementById('tableCountBadge').textContent = `${filtered.length} Entries`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr id="emptyTableState">
        <td colspan="7" class="text-center empty-state">
          <div class="empty-content">
            <i class="fa-solid fa-folder-open"></i>
            <p>No recipients found matching criteria.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((row, idx) => {
    const leafHash = generateLeafHash(row.address, row.amount, row.shielded);
    const addressShort = `${row.address.slice(0, 6)}...${row.address.slice(-6)}`;
    
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div class="address-cell" title="${row.address}">
            <i class="fa-solid fa-key icon-purple"></i>
            <code>${addressShort}</code>
          </div>
        </td>
        <td><span class="role-badge">${row.role}</span></td>
        <td><span class="amount-cell">${formatUSDC(row.amount)}</span></td>
        <td>
          ${row.shielded 
            ? `<span class="badge badge-purple"><i class="fa-solid fa-shield-halved"></i> ZK Shielded</span>`
            : `<span class="badge badge-warning"><i class="fa-solid fa-eye"></i> Public</span>`
          }
        </td>
        <td><span class="hash-code">${leafHash}</span></td>
        <td>
          <button class="btn-icon-sm" onclick="removeRecipient('${row.id}')" title="Delete Row">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Remove Recipient
window.removeRecipient = function(id) {
  appState.payrollData = appState.payrollData.filter(r => r.id !== id);
  renderTable();
  updateMetrics();
  updateChart();
  logTerminal('info', `[PAYROLL] Removed recipient entry ${id}`);
};

// Clear Table
function clearTable() {
  appState.payrollData = [];
  renderTable();
  updateMetrics();
  updateChart();
  updateWizardStep(1);
  logTerminal('info', '[PAYROLL] Cleared recipient editor.');
  showToast('Table cleared', 'info');
}

// Update Summary Telemetry & Metrics
function updateMetrics() {
  const totalAmount = appState.payrollData.reduce((acc, curr) => acc + curr.amount, 0);
  const count = appState.payrollData.length;

  // Standard Token Account Rent: ~0.002039 SOL ($0.30 per user) vs ZK Compressed Leaf: 0.000005 SOL ($0.0007 per user)
  const solPriceUSDT = 150.00;
  const standardRentSol = count * 0.002039;
  const zkRentSol = count * 0.000005;
  const rentSavedSol = standardRentSol - zkRentSol;
  const rentSavedUSD = rentSavedSol * solPriceUSDT;

  document.getElementById('summaryTotalAmount').textContent = formatUSDC(totalAmount);
  document.getElementById('summaryRecipientCount').textContent = `${count} Remote Employees`;
  document.getElementById('summaryRentSaved').textContent = `$${rentSavedUSD.toFixed(2)} (${rentSavedSol.toFixed(4)} SOL)`;

  // Enable/Disable Execute Button
  const execBtn = document.getElementById('executeBatchBtn');
  if (count > 0 && !appState.isExecuting) {
    execBtn.disabled = false;
  } else {
    execBtn.disabled = true;
  }

  // Update Merkle Root Hash preview
  if (count > 0) {
    const rootHash = `0x${Math.abs(totalAmount * 8492).toString(16).padStart(8, '0')}...${count}leafs`;
    document.getElementById('merkleRootHash').textContent = rootHash;
    document.getElementById('nullifierCount').textContent = `${count} Nullifiers`;
  } else {
    document.getElementById('merkleRootHash').textContent = '0x8f3a...92b4';
    document.getElementById('nullifierCount').textContent = '0 Active';
  }
}

// Modal Handlers
function openAddRecipientModal() {
  document.getElementById('recipientModal').classList.add('active');
}

function closeModal() {
  document.getElementById('recipientModal').classList.remove('active');
  document.getElementById('recipientForm').reset();
}

function handleRecipientFormSubmit(e) {
  e.preventDefault();
  const address = document.getElementById('recipientAddress').value.trim();
  const amount = parseFloat(document.getElementById('recipientAmount').value);
  const role = document.getElementById('recipientRole').value;
  const shielded = document.getElementById('recipientShielded').checked;

  if (address && amount > 0) {
    appState.payrollData.push({
      id: String(Date.now()),
      address,
      amount,
      role,
      shielded,
      status: 'Ready'
    });

    renderTable();
    updateMetrics();
    updateChart();
    updateWizardStep(2);
    closeModal();
    logTerminal('success', `[PAYROLL] Added recipient: ${address.slice(0, 8)}... (${formatUSDC(amount)})`);
    showToast('Recipient added', 'success');
  }
}

// Wizard Step Navigation Visualizer
function updateWizardStep(stepNum) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}Indicator`);
    if (i < stepNum) {
      el.className = 'step completed';
    } else if (i === stepNum) {
      el.className = 'step active';
    } else {
      el.className = 'step';
    }
  }
}

// Terminal Console Logging
function logTerminal(type, msg) {
  const terminal = document.getElementById('terminalBody');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function clearTerminal() {
  document.getElementById('terminalBody').innerHTML = '';
}

function copyTerminalLogs() {
  const text = document.getElementById('terminalBody').innerText;
  navigator.clipboard.writeText(text);
  showToast('Terminal logs copied to clipboard', 'info');
}

// Toast Notifications
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Chart.js Setup & Updates
function initChart() {
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  appState.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Executive'],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#9945FF',
          '#14F195',
          '#00C2FF',
          '#FF3B6B',
          '#FFC02D',
          '#3B82F6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!appState.chartInstance) return;

  if (appState.currentChartType === 'dept') {
    const depts = {'Engineering': 0, 'Design': 0, 'Product': 0, 'Marketing': 0, 'Operations': 0, 'Executive': 0};
    appState.payrollData.forEach(item => {
      if (depts[item.role] !== undefined) depts[item.role] += item.amount;
    });

    appState.chartInstance.config.type = 'doughnut';
    appState.chartInstance.data = {
      labels: Object.keys(depts),
      datasets: [{
        data: Object.values(depts),
        backgroundColor: ['#9945FF', '#14F195', '#00C2FF', '#FF3B6B', '#FFC02D', '#3B82F6'],
        borderWidth: 0
      }]
    };
    appState.chartInstance.options.plugins.legend.display = true;
  } else {
    // Rent Savings Bar Chart
    const count = appState.payrollData.length || 10;
    const stdRentUSD = count * 0.002039 * 150;
    const zkRentUSD = count * 0.000005 * 150;

    appState.chartInstance.config.type = 'bar';
    appState.chartInstance.data = {
      labels: ['Standard Solana Accounts', 'ZK-Compressed State'],
      datasets: [{
        label: 'Rent Cost ($ USD)',
        data: [stdRentUSD, zkRentUSD],
        backgroundColor: ['#FF3B6B', '#14F195'],
        borderRadius: 8
      }]
    };
    appState.chartInstance.options.plugins.legend.display = false;
  }

  appState.chartInstance.update();
}

// 1-Click Batch Payout Execution Simulator
async function executeBatchPayout() {
  if (appState.payrollData.length === 0 || appState.isExecuting) return;

  appState.isExecuting = true;
  const execBtn = document.getElementById('executeBatchBtn');
  const btnText = document.getElementById('executeBtnText');
  execBtn.disabled = true;
  btnText.textContent = 'Generating ZK Proof & Executing...';

  updateWizardStep(3);
  logTerminal('info', '==================================================');
  logTerminal('info', '[ZK_PROVER] Starting Light Protocol Groth16 Batch Proof Generation...');

  const steps = [
    { num: 1, title: 'Poseidon Hashing & Merkle Subtree Insertion', delay: 800, percent: 25 },
    { num: 2, title: 'Witness Construction & Pedersen Commitments', delay: 1000, percent: 50 },
    { num: 3, title: 'Groth16 Proof Circuit Verification (`sol_verify_groth16`)', delay: 1200, percent: 75 },
    { num: 4, title: 'Solana Devnet RPC Transaction Settlement Broadcast', delay: 900, percent: 100 }
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    
    // Set UI step active
    document.getElementById(`pstep${s.num}`).classList.add('active');
    document.getElementById('progressBarFill').style.width = `${s.percent}%`;
    document.getElementById('proofPercentText').textContent = `${s.percent}%`;
    document.getElementById('proofStatusText').textContent = s.title;

    if (s.num === 1) {
      logTerminal('info', `[POSEIDON] Computing Merkle leaf hashes for ${appState.payrollData.length} recipients...`);
      logTerminal('ready', `[LEAF_TREE] Subtree Leaf Root: 0x9b4a8e${Date.now().toString(16)}`);
    } else if (s.num === 2) {
      logTerminal('info', `[WITNESS] Witness vector generated (${appState.payrollData.length * 32} bytes).`);
      logTerminal('info', `[CONFIDENTIAL] Shielded Pedersen Commitments masked via curve bn254.`);
    } else if (s.num === 3) {
      logTerminal('info', `[GROTH16] Verifying proof via Solana Syscall \`sol_verify_groth16\`...`);
      logTerminal('success', `[PROOF_VALID] Groth16 proof evaluated in 48ms. A, B, C commitments valid.`);
    } else if (s.num === 4) {
      logTerminal('info', `[RPC] Broadcasting transaction to Solana RPC (${appState.network})...`);
    }

    await new Promise(res => setTimeout(res, s.delay));
    document.getElementById(`pstep${s.num}`).classList.remove('active');
    document.getElementById(`pstep${s.num}`).classList.add('done');
  }

  // Finalize Execution
  const txSig = generateTxSig();
  const batchId = `ZK-${Math.floor(80000 + Math.random() * 10000)}`;
  const totalAmount = appState.payrollData.reduce((acc, curr) => acc + curr.amount, 0);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const newMerkleRoot = `0x${Math.abs(totalAmount * 9999).toString(16).padStart(8, '0')}...${Math.floor(Math.random()*90+10)}`;

  // Deduct from Vault Balance
  appState.vaultBalanceUSDC -= totalAmount;
  document.getElementById('vaultBalance').textContent = formatUSDC(appState.vaultBalanceUSDC);

  // Add to History
  appState.historyData.unshift({
    id: `#${batchId}`,
    timestamp: now,
    count: appState.payrollData.length,
    totalAmount: totalAmount,
    merkleRoot: newMerkleRoot,
    txSignature: txSig,
    status: 'Finalized'
  });

  renderHistoryTable();
  updateWizardStep(4);

  logTerminal('success', `[CONFIRMED] Transaction Finalized! Tx Signature: ${txSig}`);
  logTerminal('success', `[SETTLEMENT] Successfully distributed ${formatUSDC(totalAmount)} to ${appState.payrollData.length} recipients.`);
  logTerminal('info', '==================================================');

  showToast(`Batch ${batchId} Executed Successfully!`, 'success');

  // Reset Button & State
  appState.isExecuting = false;
  btnText.textContent = 'Execute ZK Batch Payout (1-Click)';
  execBtn.disabled = false;
}

// Render History Table
function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = appState.historyData.map(item => `
    <tr>
      <td><code>${item.id}</code></td>
      <td>${item.timestamp}</td>
      <td>${item.count} Employees</td>
      <td>${formatUSDC(item.totalAmount)}</td>
      <td><span class="hash-code">${item.merkleRoot}</span></td>
      <td>
        <a href="#" class="sol-link" onclick="alert('Solana Explorer Signature: ${item.txSignature}')">
          ${item.txSignature.slice(0, 8)}...${item.txSignature.slice(-6)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </td>
      <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> ${item.status}</span></td>
    </tr>
  `).join('');
}
