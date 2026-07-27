const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');
const { isValidGuest, sanitizeGuest } = require('./_ospiti');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).end();

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  const { id, checkIn, checkOut, ospiti } = parsed;

  if (!id) return res.status(400).json({ error: 'ID mancante' });
  if (!checkIn || !checkOut || !Array.isArray(ospiti) || ospiti.length < 1 || ospiti.length > 2) {
    return res.status(400).json({ error: 'Dati mancanti o non validi' });
  }
  if (!ospiti.every(isValidGuest)) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori per ogni ospite' });
  }

  const docs = await readMetadata();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

  doc.checkIn = checkIn;
  doc.checkOut = checkOut;
  doc.ospiti = ospiti.map(sanitizeGuest);

  await writeMetadata(docs);

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true });
};
