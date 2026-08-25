export default async function handler(req, res) {
  // Можно будет передавать канал в URL: ?channel=nn52signal
  const channel = req.query.channel || 'nn52signal';
  const targetUrl = `https://t.me/s/${channel}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Обязательно притворяемся обычным браузером
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Telegram ответил статусом ${response.status}`);
    }

    const html = await response.text();

    // Разрешаем CORS (чтобы хостинг не ругался) и отдаем HTML
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}