export default async function handler(req, res) {
  // Получаем имя канала без символа '@', если его случайно передали
  let channel = req.query.channel || 'nn52signal';
  channel = channel.replace(/^@/, '');

  // Основной источник (RSSForever) и запасной (TGStat)
  const primaryUrl = `https://rsshub.rssforever.comолпа/telegram/channel/${channel}`;
  const fallbackUrl = `https://tgstat.ru/channel/@${channel}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  // Попытка 1: RSSForever
  try {
    console.log(`[Attempt 1] Fetching from RSSForever: ${primaryUrl}`);
    const response = await fetch(primaryUrl, { headers });

    console.log(`[Attempt 1 Status] ${response.status} ${response.statusText}`);

    if (response.ok) {
      const xmlData = await response.text();
      // Проверяем, что в ответе действительно XML/RSS, а не заглушка Cloudflare
      if (xmlData.includes('<rss') || xmlData.includes('<feed')) {
        console.log(`[Success 1] RSSForever returned valid feed (${xmlData.length} bytes)`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        return res.status(200).send(xmlData);
      }
      console.warn('[Attempt 1 Warning] RSSForever returned 200 OK, but content is not XML. Falling back...');
    } else {
      console.warn(`[Attempt 1 Failed] Status: ${response.status}`);
    }
  } catch (err) {
    console.error('[Attempt 1 Exception]', err.message);
  }

  // Попытка 2: TGStat (Запасной вариант)
  try {
    console.log(`[Attempt 2] Fetching fallback from TGStat: ${fallbackUrl}`);
    const fallbackResponse = await fetch(fallbackUrl, { headers });

    console.log(`[Attempt 2 Status] ${fallbackResponse.status} ${fallbackResponse.statusText}`);

    if (!fallbackResponse.ok) {
      const errorText = await fallbackResponse.text();
      console.error(`[Attempt 2 Failed] Status: ${fallbackResponse.status}`, errorText.slice(0, 200));
      return res.status(fallbackResponse.status).json({
        error: `Все источники недоступны. TGStat ответил статусом ${fallbackResponse.status}`,
        details: errorText.slice(0, 200)
      });
    }

    const htmlData = await fallbackResponse.text();
    console.log(`[Success 2] TGStat returned HTML page (${htmlData.length} bytes)`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlData);

  } catch (err) {
    console.error('[Attempt 2 Exception]', err.message);
    return res.status(500).json({
      error: 'Ошибка при получении данных со всех источников',
      message: err.message
    });
  }
}
