const crypto = require('crypto');
const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');

function sanitizeGuest(o) {
  return {
    sesso: o.sesso || '',
    cognome: o.cognome || '',
    nome: o.nome || '',
    dataNascita: o.dataNascita || '',
    cittadinanza: o.cittadinanza || '',
    luogoNascita: o.luogoNascita || '',
    luogoResidenza: o.luogoResidenza || '',
    tipoDocumento: o.tipoDocumento || '',
    numeroDocumento: o.numeroDocumento || '',
    luogoRilascio: o.luogoRilascio || '',
    indirizzoResidenza: o.indirizzoResidenza || null,
    codiceFiscale: o.codiceFiscale || null
  };
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  const { checkIn, checkOut, ospiti } = parsed;
  if (!checkIn || !checkOut || !Array.isArray(ospiti) || ospiti.length < 1 || ospiti.length > 2) {
    return res.status(400).json({ error: 'Dati mancanti o non validi' });
  }

  const record = {
    id: crypto.randomUUID(),
    checkIn,
    checkOut,
    ospiti: ospiti.map(sanitizeGuest),
    stato: 'pending',
    createdAt: new Date().toISOString()
  };

  const docs = await readMetadata();
  docs.unshift(record);
  await writeMetadata(docs);

  res.setHeader('Content-Type', 'application/json');
  res.status(201).json({ ok: true, id: record.id });
};
