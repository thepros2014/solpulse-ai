document.addEventListener('DOMContentLoaded', () => {
    
    // Simulate fetching agent vaults
    const vaults = [
        { name: 'TradingBot Alpha', cap: 50, spent: 12.4, policy: 'Standard', frozen: false },
        { name: 'Data Scraper X', cap: 5, spent: 4.8, policy: 'Permissive', frozen: false },
        { name: 'Whale Watcher', cap: 100, spent: 100, policy: 'Strict', frozen: true }
    ];

    const vaultList = document.getElementById('vault-list');
    vaults.forEach(v => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderLeftColor = v.frozen ? '#ef4444' : 'var(--sol-purple)';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
                <strong>${v.name}</strong>
                <span style="color:${v.frozen ? '#ef4444' : 'var(--sol-green)'}">${v.frozen ? 'FROZEN' : 'ACTIVE'}</span>
            </div>
            <div>Cap: ${v.cap} USDC | Spent: ${v.spent} USDC</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem">Policy: ${v.policy}</div>
        `;
        vaultList.appendChild(div);
    });

    // Simulate incoming x402 payment stream
    const txFeed = document.getElementById('tx-feed');
    const animAmount = document.getElementById('anim-amount');
    const endpoints = [
        { path: '/api/solana/price', price: 0.001 },
        { path: '/api/narrative/signals', price: 0.005 },
        { path: '/api/agent/execute-swap', price: 0.01 }
    ];

    function addTx() {
        const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
        const agent = vaults[Math.floor(Math.random() * vaults.length)];
        
        if (agent.frozen) return; // Skip frozen

        const div = document.createElement('div');
        div.className = 'tx-row';
        div.innerHTML = `[${new Date().toLocaleTimeString()}] ${agent.name} paid <span class="amt">${ep.price} USDC</span> for <span class="to">${ep.path}</span>`;
        
        txFeed.insertBefore(div, txFeed.firstChild);
        if (txFeed.children.length > 15) {
            txFeed.removeChild(txFeed.lastChild);
        }

        // Update animation
        animAmount.textContent = `${ep.price} USDC`;
    }

    setInterval(addTx, 2500);
});
