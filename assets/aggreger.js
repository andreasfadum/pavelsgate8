/* Regner ut samlede resultater fra en liste med svar.
   Samme fil brukes to steder:
   - i nettleseren (prototype uten tilkobling)
   - i Google Apps Script som «Aggreger.gs», slik at rådata aldri forlater regnearket.
   Funksjonen kjenner ikke spørsmålstekstene – areal- og behov-ID-er leses fra svarene selv. */

function aggreger(svar) {
  var n = svar.length;
  var pros = function (a, b) { return b ? Math.round(100 * a / b) : 0; };
  var tell = function (lister) {
    var t = {};
    lister.forEach(function (x) { (x || []).forEach(function (v) { t[v] = (t[v] || 0) + 1; }); });
    return t;
  };
  var sorter = function (o) {
    return Object.keys(o).map(function (k) { return { v: k, n: o[k] }; }).sort(function (a, b) { return b.n - a.n; });
  };
  var idFra = function (monster) {
    var ider = {};
    svar.forEach(function (s) {
      Object.keys(s).forEach(function (k) { var m = k.match(monster); if (m) ider[m[1]] = true; });
    });
    return Object.keys(ider);
  };

  var arealer = idFra(/^areal\.([^.]+)\.frekvens$/).map(function (id) {
    var k = 'areal.' + id + '.';
    var besvart = svar.filter(function (s) { return typeof s[k + 'frekvens'] === 'number'; });
    var brukere = besvart.filter(function (s) { return s[k + 'frekvens'] > 0; });
    var jevnlig = besvart.filter(function (s) { return s[k + 'frekvens'] >= 2; });
    var tilst = brukere.map(function (s) { return s[k + 'tilstand']; }).filter(function (v) { return typeof v === 'number'; });
    var vikt = besvart.map(function (s) { return s[k + 'viktighet']; }).filter(function (v) { return typeof v === 'number'; });
    var viktBrukere = brukere.map(function (s) { return s[k + 'viktighet']; }).filter(function (v) { return typeof v === 'number'; });
    return {
      id: id,
      n: besvart.length,
      bruk: pros(brukere.length, besvart.length),
      jevnlig: pros(jevnlig.length, besvart.length),
      tilstand: tilst.length ? tilst.reduce(function (a, b) { return a + b; }, 0) / tilst.length : null,
      tilstandN: tilst.length,
      viktig: pros(vikt.filter(function (v) { return v === 3; }).length, vikt.length),
      viktigBrukere: pros(viktBrukere.filter(function (v) { return v === 3; }).length, viktBrukere.length),
      problemer: sorter(tell(brukere.map(function (s) {
        return (s[k + 'problemer'] || []).filter(function (p) { return p !== 'ingen'; });
      }))),
      hvorforIkke: sorter(tell(besvart.filter(function (s) { return s[k + 'frekvens'] === 0; })
        .map(function (s) { return s[k + 'hvorfor_ikke']; })))
    };
  });

  var topp = tell(svar.map(function (s) { return s.topp3; }));
  var neste = tell(svar.map(function (s) { return s.neste3; }));
  var valgt = tell(svar.map(function (s) { return s.viktig; }));
  var behov = idFra(/^behov\.(.+)$/).map(function (id) {
    var v = svar.map(function (s) { return s['behov.' + id]; }).filter(function (x) { return typeof x === 'number'; });
    return { id: id, n: v.length, svaertViktig: pros(v.filter(function (x) { return x === 3; }).length, v.length), topp3: topp[id] || 0, neste3: neste[id] || 0, valgt: valgt[id] || 0 };
  }).sort(function (a, b) { return b.svaertViktig - a.svaertViktig || b.topp3 - a.topp3; });

  var endring = {}, kostnad = {}, uteFrekvens = {};
  svar.forEach(function (s) {
    if (s.endring !== undefined) endring[s.endring] = (endring[s.endring] || 0) + 1;
    if (s.kostnad !== undefined) kostnad[s.kostnad] = (kostnad[s.kostnad] || 0) + 1;
    if (s['ute.frekvens'] !== undefined) uteFrekvens[s['ute.frekvens']] = (uteFrekvens[s['ute.frekvens']] || 0) + 1;
  });
  var uteBesvart = svar.filter(function (s) { return (s['ute.onsker'] || []).length; }).length;

  // Fordeling for flervalg og enkeltvalg i nyere spørsmål (uteareal, sykkel, retning for topp 3).
  // Fritekst (.kommentar) telles ikke.
  var fordeling = {};
  svar.forEach(function (s) {
    Object.keys(s).forEach(function (k) {
      if (!/^(ute|sykkel|viktig)\./.test(k) || /\.kommentar$/.test(k)) return;
      var f = fordeling[k] || (fordeling[k] = {});
      [].concat(s[k]).forEach(function (v) { f[v] = (f[v] || 0) + 1; });
    });
  });

  return {
    n: n,
    fordeling: fordeling,
    arealer: arealer,
    behov: behov,
    endring: endring,
    kostnad: kostnad,
    vedlikehold: tell(svar.map(function (s) { return s.vedlikehold; })),
    ute: { frekvens: uteFrekvens, onsker: tell(svar.map(function (s) { return s['ute.onsker']; })), n: uteBesvart }
  };
}
