// Endpoint pubblico — verifica solo se il codice corrisponde, non espone
// mai il valore reale di GESTIONE_LINK_CODE al client.

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const { searchParams } = new URL(req.url, 'http://x');
  const codice = searchParams.get('codice');

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: !!codice && codice === process.env.GESTIONE_LINK_CODE });
};
