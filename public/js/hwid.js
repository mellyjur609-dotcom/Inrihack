function getDeviceInfo() {
  const ua = navigator.userAgent;
  let model = 'Unknown Device';
  if (/Android/.test(ua)) {
    const m = ua.match(/\(.*?(.*?)\)/);
    model = m ? m[0] : 'Android Device';
  } else if (/iPhone/.test(ua)) model = 'iPhone';
  
  return {
    model: model,
    platform: navigator.platform,
    vendor: navigator.vendor || 'unknown',
    screen: `${screen.width}x${screen.height}`,
    language: navigator.language,
    cores: navigator.hardwareConcurrency || 4
  };
}

function getHWID() {
  const info = getDeviceInfo();
  const raw = info.model + info.platform + info.screen + info.language + (navigator.userAgent.length);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'ERI-' + Math.abs(hash).toString(16).toUpperCase() + '-' + btoa(info.model).substring(0,6).replace(/=/g,'');
}