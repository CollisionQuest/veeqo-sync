const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Proxy: Veeqo API
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

// Proxy: QuickBase insert record
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
