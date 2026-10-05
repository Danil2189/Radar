export default async function handler(req, res) {
  // Можно передавать канал в URL: ?channel=nn52signal
  const channel = req.query.channel || 'nn52signal';
  
  // Используем публичный RSSHub для получения RSS/XML ленты канала
  const targetUrl = `https://rsshub.app/telegram/channel/${channel}`;

  console.log(`[Request] Fetching RSS feed for channel: "${channel}" from ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    console.log(`[Response Status] ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[RSSHub Error] Status: ${response.status}`, errorBody.slice(0, 300));
      
      return res.status(response.status).json({
        error: `RSSHub ответил статусом ${response.status}`,
        details: errorBody.slice(0, 200)
      });
    }

    const xmlData = await response.text();
    console.log(`[Success] Successfully fetched ${xmlData.length} bytes from RSSHub`);

    // Разрешаем CORS и отдаем RSS/XML
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(xmlData);

  } catch (error) {
    console.error('[Fetch Exception]', error);
    res.status(500).json({
      error: 'Ошибка при запросе к RSSHub',
      message: error.message
    });
  }
}
