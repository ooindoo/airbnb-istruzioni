const REQUIRED_FIELDS = [
  'sesso', 'cognome', 'nome', 'dataNascita', 'cittadinanza',
  'luogoNascita', 'luogoResidenza', 'tipoDocumento', 'numeroDocumento', 'luogoRilascio'
];

function isValidGuest(o) {
  if (!o || !REQUIRED_FIELDS.every(f => typeof o[f] === 'string' && o[f].trim() !== '')) {
    return false;
  }

  // Indirizzo di residenza e Codice Fiscale sono facoltativi, ma se presenti
  // devono esserlo entrambi insieme — non uno dei due soltanto.
  const hasIndirizzo = !!(o.indirizzoResidenza && String(o.indirizzoResidenza).trim());
  const hasCodiceFiscale = !!(o.codiceFiscale && String(o.codiceFiscale).trim());
  if (hasIndirizzo !== hasCodiceFiscale) return false;

  return true;
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
