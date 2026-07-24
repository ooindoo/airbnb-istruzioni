const { put } = require('@vercel/blob');
const busboy = require('busboy');
const crypto = require('crypto');
const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const fields = {};
  let fileBuffer = null;
  let mimeType = 'image/jpeg';

  await new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    bb.on('file', (_name, stream, info) => {
      mimeType = info.mimeType || 'image/jpeg';
      const chunks = [];
      stream.on('data', d => chunks.push(d));
      stream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('finish', resolve);
    bb.on('error', reject);
    req.pipe(bb);
  });

  if (!fileBuffer || fileBuffer.length < 100) {
    return res.status(400).json({ error: 'Nessun file ricevuto' });
  }

  const id = crypto.randomUUID();
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fotoBlobPath = `gestione/docs/${id}.${ext}`;

  const blobResult = await put(fotoBlobPath, fileBuffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  const record = {
    id,
    ospite: (fields.ospite || '').trim(),
    checkIn: fields.checkIn || new Date().toISOString().split('T')[0],
    fotoBlobPath,
    fotoBlobUrl: blobResult.url,
    mimeType,
    stato: 'pending',
    createdAt: new Date().toISOString()
  };

  const docs = await readMetadata();
  docs.unshift(record);
  await writeMetadata(docs);

  res.setHeader('Content-Type', 'application/json');
  res.status(201).json({ ok: true, id });
};
