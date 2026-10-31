const savedKey = localStorage.getItem('erihack_key');
const savedHwid = localStorage.getItem('erihack_hwid');
if (!savedKey) location.href = '/';
document.getElementById('keyShow').innerText = savedKey;

let timerInt;
async function init() {
  const res = await fetch('/api/status/' + savedKey);
  const data = await res.json();
  if (!data.success) {
    document.getElementById('timer').innerText = 'EXPIRED';
    document.getElementById('typeShow').innerText = 'Key expired, contact 07018511654';
    return;
  }
  document.getElementById('typeShow').innerText = 'License active';
  startTimer(data.expiresAt);
}

function startTimer(exp) {
  timerInt = setInterval(() => {
    const diff = exp - Date.now();
    if (diff <= 0) { document.getElementById('timer').innerText = 'EXPIRED'; clearInterval(timerInt); localStorage.clear(); return; }
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    document.getElementById('timer').innerText = `${d}d ${h}h ${m}m ${s}s`;
  },1000);
}

function gen() {
  const info = getDeviceInfo();
  // Sensitivity logic based on device cores & screen
  const base = info.cores > 6 ? 85 : 78;
  const sensi = {
    General: base + Math.floor(Math.random()*10),
    'Red Dot': base - 2 + Math.floor(Math.random()*8),
    '2X Scope': 70 + Math.floor(Math.random()*10),
    '4X Scope': 60 + Math.floor(Math.random()*10),
    'Sniper Scope': 50 + Math.floor(Math.random()*10),
    'Free Look': 75 + Math.floor(Math.random()*15),
    'DPI': info.screen.includes('1080') ? 480 : 420,
    'Fire Button': 45 + Math.floor(Math.random()*10),
    'Device': info.model
  };
  document.getElementById('sensiBox').innerHTML = Object.entries(sensi).map(([k,v])=> `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('') + `<p style="color:#6bffae;font-size:12px;margin-top:10px">Optimized for ${info.model} - Erihack Pro</p>`;
}
function logout(){ localStorage.clear(); location.href='/'; }
init();