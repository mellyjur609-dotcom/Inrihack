let token = null;
async function login() {
  const password = document.getElementById('adminPass').value;
  const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
  const data = await res.json();
  if (data.success) {
    token = data.token;
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('panel').classList.remove('hidden');
    loadKeys();
  } else document.getElementById('loginMsg').innerText = data.message;
}
async function create() {
  const value = document.getElementById('val').value;
  const unit = document.getElementById('unit').value;
  const deviceType = document.getElementById('dtype').value;
  if (!value) return alert('Enter validity');
  const res = await fetch('/api/admin/keys/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, value, unit, deviceType }) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('cMsg').innerText = 'Generated: ' + data.data.key + ' (' + data.data.validity + ')';
    loadKeys();
  }
}
async function loadKeys() {
  const res = await fetch('/api/admin/keys?token=' + token);
  const keys = await res.json();
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = keys.map(k => `
  <tr>
  <td><b>${k.key}</b></td>
  <td>${k.validity}</td>
  <td><span class="badge ${k.deviceType==='one'?'b-one':'b-unlim'}">${k.deviceType}</span></td>
  <td>${!k.used ? '<span style="color:#8a90b5">Unused</span>' : (Date.now()>k.expiresAt ? '<span style="color:#ff6b6b">Expired</span>' : '<span style="color:#6bffae">Active</span>')}<br><small>${k.used ? new Date(k.expiresAt).toLocaleString() : ''}</small></td>
  <td><small>${k.lockedDevice ? k.lockedDevice.model + '<br>' + k.hwid : 'Not locked yet'}</small></td>
  <td><button onclick="delKey('${k.key}')" style="background:#ff3c00">Delete</button></td>
  </tr>`).join('');
}
async function delKey(key) {
  if(!confirm('Delete '+key+'?')) return;
  await fetch('/api/admin/keys/'+key+'?token='+token, { method:'DELETE' });
  loadKeys();
}