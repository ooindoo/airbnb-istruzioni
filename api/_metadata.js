const { put, list } = require('@vercel/blob');

const METADATA_PATH = 'gestione/metadata.json';

async function readMetadata() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const { blobs } = await list({ prefix: METADATA_PATH, token });
    if (!blobs.length) return [];

    // Bearer auth for private blob reads (OIDC automatic in Vercel Functions)
    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function writeMetadata(data) {
  await put(METADATA_PATH, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

module.exports = { readMetadata, writeMetadata };
