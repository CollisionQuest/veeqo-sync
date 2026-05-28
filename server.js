const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

app.post('/api/quickbase/records', async (req, res) => {
  try {
    const qbToken = req.headers['x-qb-token'];
    const qbRealm = req.headers['x-qb-realm'];
    if (!qbToken || !qbRealm) return res.status(400).json({ error: 'Missing QB credentials' });

    console.log('TOKEN RECEIVED (first 25 chars):', qbToken.slice(0, 25));
    console.log('QB Realm:', qbRealm);
    console.log('Payload:', JSON.stringify(req.body).slice(0, 200));

    const resp = await fetch('https://api.quickbase.com/v1/records', {
      method: 'POST',
      headers: {
        'QB-Realm-Hostname': qbRealm,
        'Authorization': `QB-USER-TOKEN ${qbToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'veeqo-sync/1.0'
      },
      body: JSON.stringify(req.body)
    });

    const text = await resp.text();
    console.log('QB STATUS:', resp.status);
    console.log('QB RESPONSE:', text.slice(0, 300));

    try {
      res.status(resp.status).json(JSON.parse(text));
    } catch {
      res.status(resp.status).json({ error: text });
    }
  } catch (e) {
    console.error('QB error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Updated: ${new Date().toISOString()}
