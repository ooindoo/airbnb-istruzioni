const { get, put } = require('@vercel/blob');

const CLIENT_ID = 'c9bf478b-fb16-4fa4-9132-b00044a38284';
const SCOPE = 'Files.ReadWrite offline_access';
const TOKEN_PATH = 'gestione/graph-token.json';
const FILE_NAME = 'Fatturazione Ospiti_Giuseppe Toniolo.xlsx';
const TABLE_NAME = 'CheckIn';

async function readGraphToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const result = await get(TOKEN_PATH, { access: 'private', token, useCache: false });
  if (!result) throw new Error('graph-token.json non trovato su Blob');

  const chunks = [];
  for await (const c of result.stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

async function writeGraphToken(refreshToken) {
  await put(TOKEN_PATH, JSON.stringify({
    refreshToken,
    updatedAt: new Date().toISOString()
  }), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

async function getAccessToken() {
  const { refreshToken } = await readGraphToken();

  const res = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPE
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Graph token refresh fallito: ${data.error} — ${data.error_description || ''}`);
  }

  // Microsoft ruota il refresh token ad ogni uso — va salvato subito,
  // prima di restituire l'access_token, altrimenti il prossimo refresh fallirebbe.
  await writeGraphToken(data.refresh_token);

  return data.access_token;
}

async function findFileId(accessToken) {
  const path = encodeURIComponent(FILE_NAME);
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`File Excel non trovato: ${data.error?.message || res.status}`);
  }
  return data.id;
}

async function appendRowToExcel(rowData) {
  const accessToken = await getAccessToken();
  const fileId = await findFileId(accessToken);

  const values = [[
    rowData.checkIn,
    rowData.checkOut,
    rowData.sesso,
    rowData.cognome,
    rowData.nome,
    rowData.dataNascita,
    rowData.cittadinanza,
    rowData.luogoNascita,
    rowData.luogoResidenza,
    rowData.tipoDocumento,
    rowData.numeroDocumento,
    rowData.luogoRilascio,
    rowData.indirizzoResidenza,
    rowData.codiceFiscale
  ]];

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${TABLE_NAME}/rows/add`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Aggiunta riga Excel fallita: ${data.error?.message || res.status}`);
  }
}

module.exports = { getAccessToken, appendRowToExcel };
