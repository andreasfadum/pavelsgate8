/* Felles hjelpere for skjema og oversikt */
window.PG8 = window.PG8 || {};

PG8.lagre = function (nokkel, verdi) { try { localStorage.setItem(nokkel, JSON.stringify(verdi)); } catch (e) {} };
PG8.hent = function (nokkel) { try { return JSON.parse(localStorage.getItem(nokkel)); } catch (e) { return null; } };
PG8.slett = function (nokkel) { try { localStorage.removeItem(nokkel); } catch (e) {} };

PG8.esc = function (t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

PG8.ikon = function (navn, cls) {
  return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PG8.IKON[navn] || '') + '</svg>';
};

PG8.SMÅ = {
  hake: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  klokke: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lås: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pil: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  tilbake: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  lagre: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  folk: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.7 5 5.8"/>',
  pause: '<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>'
};
PG8.lite = function (navn) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PG8.SMÅ[navn] + '</svg>';
};

/* Fjes 1–5. Farge følger tilstand, men alltid med tekst ved siden av. */
PG8.fjes = function (n) {
  const munn = {
    1: 'M8 16.5c1.2-2 6.8-2 8 0',
    2: 'M8.5 16c1.2-1 5.8-1 7 0',
    3: 'M8.5 15.5h7',
    4: 'M8.5 14.8c1.2 1 5.8 1 7 0',
    5: 'M8 14.3c1.2 2.2 6.8 2.2 8 0'
  }[Math.max(1, Math.min(5, Math.round(n)))];
  const farge = ['#C2533A', '#D9864C', '#C9A13A', '#5E9A6E', '#2F6B4F'][Math.max(1, Math.min(5, Math.round(n))) - 1];
  return '<svg class="f" viewBox="0 0 24 24" aria-hidden="true"><circle class="hode" cx="12" cy="12" r="10" fill="' + farge + '22" stroke="' + farge + '" stroke-width="1.6"/>' +
    '<circle cx="9" cy="10" r="1.2" fill="' + farge + '"/><circle cx="15" cy="10" r="1.2" fill="' + farge + '"/>' +
    '<path d="' + munn + '" fill="none" stroke="' + farge + '" stroke-width="1.7" stroke-linecap="round"/></svg>';
};

/* Tekststørrelse A / A+ / A++ – huskes mellom besøk */
PG8.initTekst = function () {
  const html = document.documentElement;
  const lagret = PG8.hent('pg8.tekst') || '1';
  html.dataset.tekst = lagret;
  document.querySelectorAll('.tekstvalg button').forEach(function (b) {
    b.setAttribute('aria-pressed', b.dataset.str === lagret ? 'true' : 'false');
    b.addEventListener('click', function () {
      html.dataset.tekst = b.dataset.str;
      PG8.lagre('pg8.tekst', b.dataset.str);
      document.querySelectorAll('.tekstvalg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  });
};

/* Datoer: alt regnes ut fra én dato – når meldingen sendes ut (PG8.CONFIG.utsendt). */
PG8.datoer = function () {
  const C = PG8.CONFIG;
  if (!C.utsendt) return null;
  const d0 = new Date(C.utsendt + 'T12:00:00');
  const pluss = function (dager) { const d = new Date(d0); d.setDate(d.getDate() + dager); return d; };
  const fmt = function (d, ukedag) {
    return d.toLocaleDateString('nb-NO', ukedag ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long' });
  };
  const frist = pluss(C.svarfristDager);
  const r2fra = pluss(C.svarfristDager + 1), r2til = pluss(2 * C.svarfristDager + 1);
  return {
    utsendt: fmt(d0),
    svarfrist: fmt(frist, true),
    runde1: fmt(d0) + '–' + fmt(frist),
    runde2: fmt(r2fra) + '–' + fmt(r2til)
  };
};
PG8.svarfristTekst = function () {
  const d = PG8.datoer();
  return d ? d.svarfrist : 'én uke etter utsending';
};
