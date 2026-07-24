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
    // get() returns null (not throws) when the file doesn't exist in v2.6+
    const result = await get(METADATA_PATH, { access: 'private', token });
    if (!result) return [];
    const buf = await streamToBuffer(result.stream);
    return JSON.parse(buf.toString('utf-8'));
  } catch (e) {
    if (e?.name === 'BlobNotFoundError' || e?.message?.includes('not found')) {
      return [];
    }
    console.error('readMetadata error:', e?.message);
    return [];
  }
}

async function writeMetadata(data) {
  // allowOverwrite: true required in @vercel/blob v2+ to overwrite an existing blob
  await put(METADATA_PATH, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

module.exports = { readMetadata, writeMetadata };
