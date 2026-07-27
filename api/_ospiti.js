const REQUIRED_FIELDS = [
  'sesso', 'cognome', 'nome', 'dataNascita', 'cittadinanza',
  'luogoNascita', 'luogoResidenza', 'tipoDocumento', 'numeroDocumento', 'luogoRilascio'
];

function isValidGuest(o) {
  return !!o && REQUIRED_FIELDS.every(f => typeof o[f] === 'string' && o[f].trim() !== '');
}

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

module.exports = { isValidGuest, sanitizeGuest };
