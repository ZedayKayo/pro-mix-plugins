import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Simple auth check if needed, but for now we'll just serve it.
  // In a real app, you'd check a session cookie or admin token.

  try {
    // 1. Fetch data
    const { data: sessions, error: sErr } = await supabase
      .from('visitor_sessions')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(200);

    const { data: events, error: eErr } = await supabase
      .from('event_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (sErr || eErr) throw sErr || eErr;

    // 2. Format as Organized Text
    let output = `================================================================================\n`;
    output += `                   PRO-MIX PLUGINS - VISITOR ACTIVITY LOG\n`;
    output += `                   Generated at: ${new Date().toLocaleString()}\n`;
    output += `================================================================================\n\n`;

    output += `RECENT VISITOR SESSIONS\n`;
    output += `--------------------------------------------------------------------------------\n`;
    output += `${'DATE'.padEnd(20)} | ${'IP ADDRESS'.padEnd(15)} | ${'LOCATION'.padEnd(20)} | ${'DEVICE'.padEnd(15)}\n`;
    output += `--------------------------------------------------------------------------------\n`;

    sessions.forEach(s => {
      const date = new Date(s.last_seen).toLocaleString();
      const location = `${s.city || '?'}, ${s.country || '?'}`;
      const device = `${s.os} / ${s.browser}`;
      output += `${date.padEnd(20)} | ${s.ip_address.padEnd(15)} | ${location.padEnd(20)} | ${device}\n`;
    });

    output += `\n\n`;
    output += `DETAILED ACTIVITY FEED\n`;
    output += `--------------------------------------------------------------------------------\n`;
    output += `${'TIME'.padEnd(20)} | ${'SESSION'.padEnd(10)} | ${'PAGE PATH'}\n`;
    output += `--------------------------------------------------------------------------------\n`;

    events.forEach(e => {
      const time = new Date(e.created_at).toLocaleString();
      const session = (e.session_id || '').substring(0, 8);
      output += `${time.padEnd(20)} | ${session.padEnd(10)} | ${e.page_url}\n`;
    });

    output += `\n================================================================================\n`;
    output += `                            END OF LOG FILE\n`;
    output += `================================================================================\n`;

    // 3. Serve as Text File
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="visitor_activity_${new Date().toISOString().split('T')[0]}.txt"`);
    return res.status(200).send(output);

  } catch (err) {
    console.error('Log generation error:', err);
    return res.status(500).send('Error generating log file: ' + err.message);
  }
}
