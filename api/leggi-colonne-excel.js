const { requireAuth } = require('./_auth');
const { getAccessToken } = require('./_graph');

// Endpoint diagnostico temporaneo — legge nome e posizione di ogni colonna
// della tabella "CheckIn" per verificare l'ordine reale prima di modificare
// il codice del push. Va rimosso dopo l'uso.

const FILE_NAME = 'Fatturazione Ospiti_Giuseppe Toniolo.xlsx';
const TABLE_NAME = 'CheckIn';

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  res.setHeader('Content-Type', 'application/json');

  try {
    const accessToken = await getAccessToken();

    const fileRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(FILE_NAME)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const fileData = await fileRes.json();
    if (!fileRes.ok) throw new Error(fileData.error?.message || 'File non trovato');

    const colsRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileData.id}/workbook/tables/${TABLE_NAME}/columns`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const colsData = await colsRes.json();
    if (!colsRes.ok) throw new Error(colsData.error?.message || 'Colonne non trovate');

    const columns = colsData.value
      .sort((a, b) => a.index - b.index)
      .map(c => ({ index: c.index, name: c.name }));

    res.status(200).json({ ok: true, columns });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
