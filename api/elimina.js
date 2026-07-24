const { del } = require('@vercel/blob');
const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).end();

  const { searchParams } = new URL(req.url, 'http://x');
  const id = searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'ID mancante' });

  const docs = await readMetadata();
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Documento non trovato' });

  const doc = docs[idx];

  // Delete the photo blob (non-blocking failure is acceptable)
  if (doc.fotoBlobUrl) {
    try {
      await del(doc.fotoBlobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (e) {
      console.error('Blob delete failed:', e.message);
    }
  }

  docs.splice(idx, 1);
  await writeMetadata(docs);

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true });
};
