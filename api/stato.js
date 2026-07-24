const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).end();

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  const { id, stato } = parsed;
  if (!id || !['pending', 'inviato'].includes(stato)) {
    return res.status(400).json({ error: 'Parametri non validi' });
  }

  const docs = await readMetadata();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

  doc.stato = stato;
  if (stato === 'inviato') doc.inviatoAt = new Date().toISOString();

  await writeMetadata(docs);

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true });
};
