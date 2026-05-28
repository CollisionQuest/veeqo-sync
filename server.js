const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── Veeqo Orders ────────────────────────────────────────────────────────────
app.get('/api/veeqo/orders', async (req, res) => {
  try {
    const { status, page_size = 50, page = 1 } = req.query;
    const apiKey = req.headers['x-veeqo-key'];
    if (!apiKey) return res.status(400).json({ error: 'Missing Veeqo API key' });
    let url = `https://api.veeqo.com/orders?page_size=${page_size}&page=${page}`;
    if (status && status !== 'all') url += `&status=${status}`;
    const resp = await fetch(url, { headers: { 'x-api-key': apiKey } });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── eBay Orders (Sell Fulfillment API) ──────────────────────────────────────
app.get('/api/ebay/orders', async (req, res) => {
  try {
    const { limit = 50, offset = 0, filter } = req.query;
    const token = req.headers['x-ebay-token'];
    if (!token) return res.status(400).json({ error: 'Missing eBay token' });
    let url = `https://api.ebay.com/sell/fulfillment/v1/order?limit=${limit}&offset=${offset}`;
    if (filter) url += `&filter=${encodeURIComponent(filter)}`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── eBay Transactions / Fees (Sell Finances API) h────────────────────────────
app.get('/api/ebay/transactions', async (req, res) => {
  try {
    const { limit = 200, offset = 0, filterDate } = req.query;
    const token = req.headers['x-ebay-token'];
    if (!token) return res.status(400).json({ error: 'Missing eBay token' });
    let url = `https://api.ebay.com/sell/finances/v1/transaction?limit=${limit}&offset=${offset}&transactionType=SALE`;
    if (filterDate) url += `&filter=${encodeURIComponent(filterDate)}`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── QuickBase Records ────────────────────────────────────────────────────────
app.post('/api/quickbase/records', async (req, res) => {
  try {
    const qbToken = req.headers['x-qb-token'];
    const qbRealm = req.headers['x-qb-realm'];
    if (!qbToken || !qbRealm) return res.status(400).json({ error: 'Missing QB credentials' });
    const resp = await fetch('https://api.quickbase.com/v1/records', {
      method: 'POST',
      headers: {
        'QB-Realm-Hostname': qbRealm,
        'Authorization': `QB-USER-TOKEN ${qbToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'veeqo-sync/2.0'
      },
      body: JSON.stringify(req.body)
    });
    const text = await resp.text();
    try { res.status(resp.status).json(JSON.parse(text)); }
    catch { res.status(resp.status).json({ error: text }); }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
