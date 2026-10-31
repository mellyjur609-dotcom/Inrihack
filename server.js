require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'data', 'keys.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, '[]');

const loadKeys = () => JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
const saveKeys = (k) => fs.writeFileSync(KEYS_FILE, JSON.stringify(k, null, 2));

function msFromValidity(val, unit) {
  const v = Number(val);
  if (unit === 'minutes') return v * 60 * 1000;
  if (unit === 'hours') return v * 60 * 60 * 1000;
  if (unit === 'days') return v * 86400000;
  if (unit === 'months') return v * 30 * 86400000;
  return 0;
}

function genKey() {
  return 'ERI-' + Math.random().toString(36).substring(2,6).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase() + '-' + Date.now().toString().slice(-4);
}

// ACTIVATE
app.post('/api/activate', (req, res) => {
  const { key, hwid, deviceInfo } = req.body;
  if (!key || !hwid) return res.status(400).json({ success: false, message: 'Key and device required' });
  
  let keys = loadKeys();
  const found = keys.find(k => k.key === key);
  if (!found) return res.status(404).json({ success: false, message: 'Invalid Key' });
  if (!found.active) return res.status(403).json({ success: false, message: 'Key Disabled' });

  // expired check
  if (found.used && found.expiresAt && Date.now() > found.expiresAt) {
    found.active = false;
    saveKeys(keys);
    return res.status(403).json({ success: false, message: 'Key Expired' });
  }

  if (!found.used) {
    found.used = true;
    found.usedAt = Date.now();
    found.expiresAt = Date.now() + found.durationMs;
    found.deviceInfo = deviceInfo;
    if (found.deviceType === 'one') {
      found.hwid = hwid;
      found.lockedDevice = deviceInfo;
    }
  } else {
    if (found.deviceType === 'one' && found.hwid !== hwid) {
      return res.status(403).json({ success: false, message: `Key locked to ${found.lockedDevice?.model || 'another device'}. Buy unlimited to use on multiple.` });
    }
  }

  saveKeys(keys);
  return res.json({ success: true, key: found.key, expiresAt: found.expiresAt, deviceType: found.deviceType });
});

app.get('/api/status/:key', (req, res) => {
  const keys = loadKeys();
  const k = keys.find(x => x.key === req.params.key);
  if (!k) return res.json({ success: false, expired: true });
  if (!k.used || Date.now() > k.expiresAt) return res.json({ success: false, expired: true, expiresAt: k.expiresAt });
  return res.json({ success: true, expiresAt: k.expiresAt, remaining: k.expiresAt - Date.now(), key: k.key });
});

// ADMIN
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) return res.json({ success: true, token: 'ERI_ADMIN_OK' });
  res.status(401).json({ success: false, message: 'Wrong Admin Password' });
});

app.post('/api/admin/keys/create', (req, res) => {
  if (req.body.token !== 'ERI_ADMIN_OK') return res.status(401).json({ success: false });
  const { value, unit, deviceType } = req.body;
  const durationMs = msFromValidity(value, unit);
  const newKey = {
    key: genKey(),
    validity: `${value} ${unit}`,
    durationMs,
    deviceType, // one | unlimited
    used: false,
    active: true,
    hwid: null,
    lockedDevice: null,
    deviceInfo: null,
    usedAt: null,
    expiresAt: null,
    createdAt: Date.now()
  };
  const keys = loadKeys();
  keys.unshift(newKey);
  saveKeys(keys);
  res.json({ success: true, data: newKey });
});

app.get('/api/admin/keys', (req, res) => {
  if (req.query.token !== 'ERI_ADMIN_OK') return res.status(401).json({ success: false });
  res.json(loadKeys());
});

app.delete('/api/admin/keys/:key', (req, res) => {
  if (req.query.token !== 'ERI_ADMIN_OK') return res.status(401).json({ success: false });
  let keys = loadKeys();
  keys = keys.filter(k => k.key !== req.params.key);
  saveKeys(keys);
  res.json({ success: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'activation.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => console.log(`Erihack running on ${PORT}`));