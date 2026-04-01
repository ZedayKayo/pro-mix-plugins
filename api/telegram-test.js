export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, chat_id } = req.body;
    
    if (!bot_token || !chat_id) {
      return res.status(400).json({ error: 'Missing bot_token or chat_id' });
    }

    const tbUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    
    const messageText = `✅ *Pro-Mix Plugins - Integration Test*\n\n` +
                        `Your Telegram notifications are successfully configured!\n` +
                        `You will now receive real-time alerts for visitor activity.`;

    const response = await fetch(tbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat_id,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.description || 'Failed to send message' });
    }

    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
