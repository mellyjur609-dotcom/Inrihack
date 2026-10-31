async function activate() {
  const key = document.getElementById('keyInput').value.trim().toUpperCase();
  const msg = document.getElementById('msg');
  if (!key) { msg.innerText = 'Enter your Erihack key'; return; }
  
  const hwid = getHWID();
  const deviceInfo = getDeviceInfo();
  
  msg.style.color = '#8a90b5';
  msg.innerText = 'Verifying and locking device...';
  
  try {
    const res = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, hwid, deviceInfo })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('erihack_key', key);
      localStorage.setItem('erihack_hwid', hwid);
      msg.style.color = '#6bffae';
      msg.innerText = 'Activated! Redirecting...';
      setTimeout(() => window.location.href = '/dashboard', 800);
    } else {
      msg.style.color = '#ff6b6b';
      msg.innerText = data.message;
    }
  } catch(e) { msg.innerText = 'Server error, try again'; }
}