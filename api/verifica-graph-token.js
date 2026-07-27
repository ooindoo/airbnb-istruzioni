const { head } = require('@vercel/blob');
const { requireAuth } = require('./_auth');

// Endpoint di manutenzione temporaneo — verifica solo esistenza e data di
// gestione/graph-token.json, senza mai restituirne il contenuto. Va
// rimosso dopo l'uso.

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  res.setHeader('Content-Type', 'application/json');

  try {
    const info = await head('gestione/graph-token.json', {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    res.status(200).json({
      exists: true,
      uploadedAt: info.uploadedAt,
      size: info.size
    });
  } catch (e) {
    res.status(200).json({ exists: false, error: e.message });
  }
};
