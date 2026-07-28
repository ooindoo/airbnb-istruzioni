const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');
const { appendRowToExcel } = require('./_graph');

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
  if (!id || !['pending', 'inserito'].includes(stato)) {
    return res.status(400).json({ error: 'Parametri non validi' });
  }

  const docs = await readMetadata();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

  doc.stato = stato;
  if (stato === 'inserito') doc.inseritoAt = new Date().toISOString();

  await writeMetadata(docs);

  if (stato === 'inserito') {
    const ospiti = doc.ospiti || [];
    // Sequenziale, non in parallelo: ogni chiamata ruota il refresh token
    // Graph su Blob, due chiamate concorrenti userebbero lo stesso token
    // già consumato e la seconda fallirebbe.
    for (let i = 0; i < ospiti.length; i++) {
      const o = ospiti[i];
      try {
        await appendRowToExcel({
          checkIn: doc.checkIn,
          checkOut: doc.checkOut,
          sesso: o.sesso,
          cognome: o.cognome,
          nome: o.nome,
          dataNascita: o.dataNascita,
          cittadinanza: o.cittadinanza,
          luogoNascita: o.luogoNascita,
          luogoResidenza: o.luogoResidenza,
          tipoDocumento: o.tipoDocumento,
          numeroDocumento: o.numeroDocumento,
          luogoRilascio: o.luogoRilascio,
          indirizzoResidenza: o.indirizzoResidenza,
          codiceFiscale: o.codiceFiscale,
          etichettaOspite: `Ospite ${i + 1}`
        });
      } catch (e) {
        console.error(`Push Excel fallito per Ospite ${i + 1}:`, e.message);
      }
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true });
};
