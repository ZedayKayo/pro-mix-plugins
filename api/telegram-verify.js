export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, chat_id } = req.body;
    if (!bot_token) return res.status(400).json({ error: 'Missing bot_token' });

    // 1. Verify bot token via getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return res.status(400).json({
        botValid: false,
        error: 'Invalid bot token: ' + (getMeData.description || 'Unknown error')
      });
    }

    const botInfo = getMeData.result;

    // 2. If chat_id provided, try to get chat info
    let chatInfo = null;
    let chatError = null;

    if (chat_id) {
      const getChatRes = await fetch(`https://api.telegram.org/bot${bot_token}/getChat?chat_id=${chat_id}`);
      const getChatData = await getChatRes.json();
      if (getChatData.ok) {
        chatInfo = getChatData.result;
      } else {
        chatError = getChatData.description || 'Could not access chat. Make sure you sent /start to the bot first.';
      }
    }

    return res.status(200).json({ botValid: true, botInfo, chatInfo, chatError });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
