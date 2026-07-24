const { get } = require('@vercel/blob');
const { requireAuth } = require('./_auth');
const { readMetadata } = require('./_metadata');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { searchParams } = new URL(req.url, 'http://x');
  const id = searchParams.get('id');
  if (!id) return res.status(400).end();

  const docs = await readMetadata();
  const doc = docs.find(d => d.id === id);
  if (!doc?.fotoBlobPath) return res.status(404).end();

  try {
    const { stream } = await get(doc.fotoBlobPath, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    res.setHeader('Content-Type', doc.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).end(Buffer.concat(chunks));
  } catch (e) {
    console.error('foto proxy error:', e?.message);
    res.status(502).end();
  }
};
