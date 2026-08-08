const express = require('express');
const cors = require('cors');
const path = require('path');
const AgentVaultSDK = require('../sdk/agentVaultSdk');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve static files from root

const sdk = new AgentVaultSDK();

// Pricing
const PRICE_PRICE = 0.001;
const PRICE_SIGNals = 0.005;
const PRICE_SWAP = 0.01;

// Endpoints
app.get('/api/solana/price', sdk.x402Middleware('demo-key', PRICE_PRICE), (req, res) => {
    res.json({ price: 145.23, currency: 'USD', paid: req.amountPaid });
});

app.get('/api/narrative/signals', sdk.x402Middleware('demo-key', PRICE_SIGNals), (req, res) => {
    res.json({
        signals: [
            { narrative: 'DePIN', strength: 8.5 },
            { narrative: 'AI Agents', strength: 9.2 }
        ],
        paid: req.amountPaid
    });
});

app.post('/api/agent/execute-swap', sdk.x402Middleware('demo-key', PRICE_SWAP), (req, res) => {
    res.json({ 
        success: true, 
        txId: '5k...' + Math.random().toString(36).substring(7),
        message: 'Swap executed successfully on Jupiter',
        paid: req.amountPaid
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(port, () => {
    console.log(`x402 Gateway Server listening at http://localhost:${port}`);
});
