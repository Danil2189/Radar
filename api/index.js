export default async function handler(req, res) {
  // Получаем имя канала без символа '@'
  let channel = req.query.channel || 'nn52signal';
  channel = channel.replace(/^@/, '');

  // 1. Официальный веб-виджет Telegram
  const primaryUrl = `https://t.me/s/${channel}`;
  // 2. Резервное RSS-облако (RSSForever)
  const fallbackUrl = `https://rsshub.rssforever.com/telegram/channel/${channel}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  // --- ПОПЫТКА 1: Официальный Telegram (t.me/s/) ---
  try {
    console.log(`[Attempt 1] Fetching official Telegram: ${primaryUrl}`);
    const response = await fetch(primaryUrl, { headers });

    console.log(`[Attempt 1 Status] ${response.status} ${response.statusText}`);

    if (response.ok) {
      const htmlData = await response.text();

      // Проверяем, что верстка содержит сообщения, а не редирект или заглушку блокировки
      if (htmlData.includes('tgme_widget_message')) {
        console.log(`[Success 1] Official Telegram returned HTML (${htmlData.length} bytes)`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(htmlData);
      }
      console.warn('[Attempt 1 Warning] t.me returned 200 OK, but no widget messages found. Falling back...');
    } else {
      console.warn(`[Attempt 1 Failed] Status: ${response.status}`);
    }
  } catch (err) {
    console.error('[Attempt 1 Exception]', err.message);
  }

  // --- ПОПЫТКА 2: Резервный источник (RSSForever) ---
  try {
    console.log(`[Attempt 2] Fetching fallback from RSSForever: ${fallbackUrl}`);
    const fallbackResponse = await fetch(fallbackUrl, { headers });

    console.log(`[Attempt 2 Status] ${fallbackResponse.status} ${fallbackResponse.statusText}`);

    if (fallbackResponse.ok) {
      const xmlData = await fallbackResponse.text();

      if (xmlData.includes('<rss') || xmlData.includes('<feed')) {
        console.log(`[Success 2] RSSForever returned valid XML (${xmlData.length} bytes)`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        return res.status(200).send(xmlData);
      }
      console.warn('[Attempt 2 Warning] RSSForever returned 200 OK, but content is not XML.');
    } else {
      console.warn(`[Attempt 2 Failed] Status: ${fallbackResponse.status}`);
    }
  } catch (err) {
    console.error('[Attempt 2 Exception]', err.message);
  }

  // Если оба источника подвели
  return res.status(502).json({
    error: 'Ни один из источников (официальный Telegram и RSSForever) недоступен'
  });
}
