document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('data/strategy_output.json');
    if (!response.ok) throw new Error('Failed to load strategy output');
    const data = await response.json();
    
    renderSignals(data);
    renderChart(data);
    renderSchedule(data);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    document.getElementById('signals-container').innerHTML = 
      `<p style="color: red;">Error loading data. Did you run the agent first?</p>`;
  }
});

function renderSignals(data) {
  const container = document.getElementById('signals-container');
  container.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'signal-card';
    
    const actionClass = item.action.toLowerCase();
    
    card.innerHTML = `
      <div class="signal-header">
        <div>
          <div class="signal-token">${item.symbol} <span style="font-size: 14px; font-weight: normal; color: #8b949e;">$${parseFloat(item.price).toFixed(4)}</span></div>
          <div class="signal-narrative">${item.narrative}</div>
        </div>
        <div class="badge ${actionClass}">${item.action}</div>
      </div>
      <div class="signal-details">
        <span>NMS Score: ${item.nms}</span>
        <span style="font-size: 12px; color: #8b949e;">${item.rationale}</span>
      </div>
      <div class="strength-bar">
        <div class="strength-fill" style="width: ${item.nms}%"></div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

function renderSchedule(data) {
  const container = document.getElementById('schedule-container');
  container.innerHTML = '';
  
  const now = new Date();
  
  data.filter(d => d.action !== 'HOLD').forEach((item, index) => {
    const executionTime = new Date(now.getTime() + (index + 1) * 3600000); // Add hours
    const actionText = item.action === 'BUY' ? 'Buy 10 USDC worth of' : 'Rebalance 10 USDC out of';
    
    const div = document.createElement('div');
    div.className = 'schedule-item';
    div.innerHTML = `
      <span>${executionTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${executionTime.toLocaleDateString()}</span>
      <span>${actionText} <strong>${item.symbol}</strong></span>
      <span style="color: var(--jup-green);">Simulated</span>
    `;
    container.appendChild(div);
  });
  
  if (container.innerHTML === '') {
    container.innerHTML = '<p style="color: #8b949e; text-align: center; padding: 20px;">No actions scheduled at this time.</p>';
  }
}

function renderChart(data) {
  const ctx = document.getElementById('correlationChart').getContext('2d');
  
  const labels = data.map(d => d.symbol);
  const nmsScores = data.map(d => d.nms);
  
  // Dummy historical price correlation data for visual effect
  const priceCorrelations = data.map(d => (d.nms * 0.8) + (Math.random() * 20));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'NMS Score',
          data: nmsScores,
          backgroundColor: 'rgba(0, 209, 140, 0.7)',
          borderColor: '#00D18C',
          borderWidth: 1
        },
        {
          label: 'Price Momentum Index',
          data: priceCorrelations,
          type: 'line',
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.2)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#30363d' },
          ticks: { color: '#8b949e' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8b949e' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#c9d1d9' }
        }
      }
    }
  });
}
