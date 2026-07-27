const { put } = require('@vercel/blob');
const { requireAuth } = require('./_auth');

// Endpoint di manutenzione temporaneo — riceve il refresh token Microsoft Graph
// ottenuto via device code flow (script locale one-off) e lo salva su Blob
// privato. Va rimosso dopo l'uso.

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  const { refreshToken } = parsed;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'refreshToken mancante' });
  }

  await put('gestione/graph-token.json', JSON.stringify({
    refreshToken,
    updatedAt: new Date().toISOString()
  }), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true });
};
