const { requireAuth } = require('./_auth');
const { readMetadata, writeMetadata } = require('./_metadata');

// Endpoint di manutenzione temporaneo — rimuove i record del vecchio schema
// (upload foto: ospite/fotoBlobPath/stato "inviato") lasciati da prima della
// migrazione al form testuale Ross1000. Va rimosso dopo l'uso.
function isOldSchema(d) {
  return d.ospite !== undefined || d.fotoBlobPath !== undefined || d.stato === 'inviato';
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const docs = await readMetadata();
  const removed = docs.filter(isOldSchema);
  const kept = docs.filter(d => !isOldSchema(d));

  await writeMetadata(kept);

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    ok: true,
    totaleIniziale: docs.length,
    rimossi: removed.length,
    rimossiIds: removed.map(d => d.id),
    mantenuti: kept.length,
    mantenutiIds: kept.map(d => d.id)
  });
};
