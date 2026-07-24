const { getExpectedToken } = require('./_auth');

function isAuthed(req) {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split(';')
      .map(s => s.trim().split('=')).filter(([k]) => k)
      .map(([k, ...v]) => [k.trim(), v.join('=').trim()])
  );
  return cookies.gestione_auth === getExpectedToken();
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // GET: check session validity
  if (req.method === 'GET') {
    const ok = isAuthed(req);
    return res.status(ok ? 200 : 401).json({ ok });
  }

  // POST: login
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;

    let parsed;
    try { parsed = JSON.parse(body); } catch {
      return res.status(400).json({ error: 'Richiesta non valida' });
    }

    if (!parsed.password || parsed.password !== process.env.GESTIONE_PASSWORD) {
      return res.status(401).json({ error: 'Password errata' });
    }

    res.setHeader(
      'Set-Cookie',
      `gestione_auth=${getExpectedToken()}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`
    );
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
};
