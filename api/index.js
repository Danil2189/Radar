export default async function handler(req, res) {
  // Получаем имя канала без символа '@', если его передали
  let channel = req.query.channel || 'nn52signal';
  channel = channel.replace(/^@/, '');

  // Основной источник (RSSForever)
  const primaryUrl = `https://rsshub.rssforever.com/telegram/channel/${channel}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  try {
    console.log(`[Fetching] RSSForever: ${primaryUrl}`);
    const response = await fetch(primaryUrl, { headers });

    console.log(`[Status] ${response.status} ${response.statusText}`);

    if (response.ok) {
      const xmlData = await response.text();

      // Проверяем, что в ответе действительно XML/RSS, а не заглушка Cloudflare
      if (xmlData.includes('<rss') || xmlData.includes('<feed')) {
        console.log(`[Success] Returned valid RSS XML (${xmlData.length} bytes)`);
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        return res.status(200).send(xmlData);
      }

      console.warn('[Warning] Returned 200 OK, but content is not XML.');
      return res.status(502).json({
        error: 'Источник вернул некорректные данные (не XML)'
      });
    }

    return res.status(response.status).json({
      error: `RSSForever ответил статусом ${response.status}`
    });

  } catch (err) {
    console.error('[Exception]', err.message);
    return res.status(500).json({
      error: 'Ошибка при запросе к RSSForever',
      message: err.message
    });
  }
}
