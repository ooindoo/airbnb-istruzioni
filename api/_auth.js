const crypto = require('crypto');

function getExpectedToken() {
  return crypto
    .createHash('sha256')
    .update(process.env.GESTIONE_PASSWORD + process.env.GESTIONE_SECRET)
    .digest('hex');
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';')
      .map(s => s.trim().split('='))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k.trim(), v.join('=').trim()])
  );
}

function checkAuth(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.gestione_auth === getExpectedToken();
}

function requireAuth(req, res) {
  if (!checkAuth(req)) {
    res.status(401).json({ error: 'Non autorizzato' });
    return false;
  }
  return true;
}

module.exports = { getExpectedToken, requireAuth };
