const { put, get } = require('@vercel/blob');

const METADATA_PATH = 'gestione/metadata.json';

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readMetadata() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const { stream } = await get(METADATA_PATH, { access: 'private', token });
    const buf = await streamToBuffer(stream);
    return JSON.parse(buf.toString('utf-8'));
  } catch (e) {
    // File doesn't exist yet on first run — return empty list
    if (e?.name === 'BlobNotFoundError' || e?.message?.includes('not found')) {
      return [];
    }
    console.error('readMetadata error:', e?.message);
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
