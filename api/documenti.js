const { requireAuth } = require('./_auth');
const { readMetadata } = require('./_metadata');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const docs = await readMetadata();

  // pending first, then by date desc
  docs.sort((a, b) => {
    if (a.stato !== b.stato) return a.stato === 'pending' ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(docs);
};
