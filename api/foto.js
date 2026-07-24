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
  if (!doc || !doc.fotoBlobUrl) return res.status(404).end();

  // Fetch private blob — Bearer token for both local dev and production
  // (Vercel Functions also support automatic OIDC; token is the universal fallback)
  const blobRes = await fetch(doc.fotoBlobUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
  });

  if (!blobRes.ok) return res.status(502).end();

  const buffer = await blobRes.arrayBuffer();

  res.setHeader('Content-Type', doc.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.status(200).end(Buffer.from(buffer));
};
