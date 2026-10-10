/* Spørsmålsdefinisjon – runde 1 (kartlegging).
   Alt innhold i skjemaet ligger her som data. Neste runde = ny fil med samme struktur. */
window.PG8 = window.PG8 || {};

PG8.CONFIG = {
  runde: 1,
  versjon: '1.0',
  utsendt: null,          // Dato meldingen sendes ut, f.eks. '2026-10-19'. Svarfrist og runde 2 regnes ut fra denne.
  svarfristDager: 7,      // Hver runde varer én uke
  husstander: 10,         // Ti leiligheter
  minVisning: 5,          // Resultater vises først fra 5 svar (håndheves også i Apps Script)
  endpoint: '',           // Web app-URL fra Apps Script (slutter på /exec). Tom = prototype med eksempeldata.
  kontakt: '',             // E-post til styret, vises nederst på oversikten. Tom = skjules.
  hjelp: 'styret'          // Brukes i «Kontakt …». F.eks. 'Kari Nordmann i 2. etasje, tlf. 900 00 000'
};

PG8.IKON = {
  bod: '<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M3 7l2-4h14l2 4M10 11h4"/>',
  loftsbod: '<path d="M2 11 12 3l10 8"/><rect x="7" y="12" width="10" height="8" rx="1"/><path d="M10 15h4"/>',
  vask: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><path d="M7.5 6h.01M10.5 6h5"/>',
  tork: '<path d="M2 4h20"/><path d="M8.5 4 4 7.5l2 2.5 1.5-1V20h9V9l1.5 1 2-2.5L15.5 4c-.8 1.6-6.2 1.6-7 0z"/>',
  torkloft: '<path d="M2 10 12 3l10 7"/><path d="M9.5 10 6.5 12l1.4 1.8 1-.6V20h6.2v-6.8l1 .6 1.4-1.8-3-2c-.6 1-4.4 1-5 0z"/>',
  ved: '<circle cx="7" cy="16.5" r="3.5"/><circle cx="17" cy="16.5" r="3.5"/><circle cx="12" cy="9" r="3.5"/><circle cx="7" cy="16.5" r=".8"/><circle cx="17" cy="16.5" r=".8"/><circle cx="12" cy="9" r=".8"/>',
  redskap: '<path d="M20.5 3.5 11 13"/><path d="M11 13 7.5 9.5 3 14l2 5 5 2 4.5-4.5z"/><path d="M18 2l4 4"/>'
};

const BRUK_BOD = [
  { v: 'sesong', l: 'Sesongting (jul, klær)' },
  { v: 'sport', l: 'Sport og friluft' },
  { v: 'sykkel', l: 'Sykkel' },
  { v: 'dekk', l: 'Bildekk' },
  { v: 'barn', l: 'Barnevogn / barneutstyr' },
  { v: 'verktoy', l: 'Verktøy' },
  { v: 'sjelden', l: 'Ting jeg sjelden bruker' },
  { v: 'annet', l: 'Annet' }
];
const BRUK_TORK = [
  { v: 'klaer', l: 'Tørke klær' },
  { v: 'store', l: 'Tørke dyner, sengetøy, tepper' },
  { v: 'friluft', l: 'Tørke regntøy og friluftsutstyr' },
  { v: 'annet', l: 'Annet' }
];

PG8.AREALER = [
  { id: 'boder_kjeller', navn: 'Boder i underetasjen', kort: 'Boder', sted: 'Underetasje', ikon: 'bod', bruk: BRUK_BOD },
  { id: 'boder_loft', navn: 'Boder på loftet', kort: 'Loftsboder', sted: 'Loft', ikon: 'loftsbod', bruk: BRUK_BOD },
  { id: 'vaskerom', navn: 'Vaskerommet', kort: 'Vaskerom', sted: 'Underetasje', ikon: 'vask',
    info: 'Vaskemaskin som reserveres på tavla.',
    problemerEkstra: [{ v: 'utstyr', l: 'Vaskemaskinen virker dårlig' }], bruk: [
    { v: 'klesvask', l: 'Vanlig klesvask' },
    { v: 'store', l: 'Vaske store ting (dyner, tepper)' },
    { v: 'annet', l: 'Annet' }
  ] },
  { id: 'torkerom_kjeller', navn: 'Tørkerommet i underetasjen', kort: 'Tørkerom u.etg.', sted: 'Underetasje', ikon: 'tork', bruk: BRUK_TORK,
    problemerEkstra: [{ v: 'snorer', l: 'For få eller dårlige tørkesnorer' }] },
  { id: 'torkerom_loft', navn: 'Tørkerommet på loftet', kort: 'Tørkerom loft', sted: 'Loft', ikon: 'torkloft', bruk: BRUK_TORK,
    info: 'Rom med tørkesnorer for å henge opp klær.',
    problemerEkstra: [{ v: 'snorer', l: 'For få eller dårlige tørkesnorer' }] },
  { id: 'vedbod', navn: 'Vedboden', kort: 'Vedbod', sted: 'Underetasje', ikon: 'ved',
    hvorforIkkeEkstra: [{ v: 'ved_direkte', l: 'Jeg bærer veden rett opp i leiligheten' }], bruk: [
    { v: 'ved', l: 'Lagre ved til egen peis/ovn' },
    { v: 'annet', l: 'Annet' }
  ] },
  { id: 'redskapsbod', navn: 'Redskapsboden', kort: 'Redskapsbod', sted: 'Underetasje', ikon: 'redskap', bruk: [
    { v: 'hage', l: 'Låne hageredskap' },
    { v: 'snø', l: 'Snømåking og strøing' },
    { v: 'dugnad', l: 'Dugnad' },
    { v: 'verktoy', l: 'Låne verktøy' },
    { v: 'annet', l: 'Annet' }
  ] }
];

PG8.FREKVENS = [
  { v: 0, l: 'Aldri' },
  { v: 1, l: 'Noen ganger i året' },
  { v: 2, l: 'Omtrent hver måned' },
  { v: 3, l: 'Hver uke' },
  { v: 4, l: 'Flere ganger i uka' }
];

PG8.HVORFOR_IKKE = [
  { v: 'ikke_behov', l: 'Har ikke behov for det' },
  { v: 'har_eget', l: 'Har det jeg trenger i egen leilighet' },
  { v: 'visste_ikke', l: 'Visste ikke om det / vet ikke hvor det er' },
  { v: 'adkomst', l: 'Vanskelig å komme til (trapper, tunge dører)' },
  { v: 'tilstand', l: 'Det er i for dårlig stand' },
  { v: 'fullt', l: 'Det er fullt av andres ting' },
  { v: 'tilgang', l: 'Har ikke nøkkel eller tilgang' },
  { v: 'annet', l: 'Annet' }
];

PG8.TILSTAND = [
  { v: 1, l: 'Svært dårlig' },
  { v: 2, l: 'Dårlig' },
  { v: 3, l: 'Middels' },
  { v: 4, l: 'Bra' },
  { v: 5, l: 'Svært bra' }
];

PG8.PROBLEMER = [
  { v: 'fukt', l: 'Fukt eller lukt' },
  { v: 'lys', l: 'Dårlig lys' },
  { v: 'kaldt', l: 'Kaldt eller trekk' },
  { v: 'plass', l: 'For lite plass' },
  { v: 'rot', l: 'Rot og gamle ting' },
  { v: 'skittent', l: 'Skittent' },
  { v: 'las', l: 'Dårlig låst' },
  { v: 'adkomst', l: 'Vanskelig å komme til' },
  { v: 'ingen', l: 'Ingen problemer', eksklusiv: true }
];

PG8.VIKTIGHET = [
  { v: 1, l: 'Ikke viktig' },
  { v: 2, l: 'Litt viktig' },
  { v: 3, l: 'Svært viktig' }
];

PG8.BEHOV = [
  { id: 'oppbevaring', l: 'Mer oppbevaring / bodplass' },
  { id: 'sykkel', l: 'Sykkelparkering under tak' },
  { id: 'lading', l: 'Lading av elsykkel' },
  { id: 'barnevogn', l: 'Plass til barnevogn eller rullator' },
  { id: 'klesvask', l: 'Felles klesvask' },
  { id: 'torking', l: 'Tørking av klær' },
  { id: 'sosialt', l: 'Fellesrom for å møtes og feire' },
  { id: 'deling', l: 'Delingsbod – låne verktøy og utstyr' },
  { id: 'verksted', l: 'Verksted eller hobbyrom' },
  { id: 'kontor', l: 'Stille rom for arbeid eller lesing' },
  { id: 'trening', l: 'Treningsrom' },
  { id: 'gjesterom', l: 'Gjesterom for besøk' },
  { id: 'pakker', l: 'Pakkeboks / trygg levering' },
  { id: 'gjenbruk', l: 'Gjenbrukshylle og bedre kildesortering' },
  { id: 'ved', l: 'Vedlagring' }
];
PG8.BEHOV_SKALA = [
  { v: 1, l: 'Ikke viktig' },
  { v: 2, l: 'Kjekt å ha' },
  { v: 3, l: 'Svært viktig' }
];

PG8.ENDRING = [
  { v: 1, l: 'Behold som i dag', h: 'Jeg er fornøyd slik det er' },
  { v: 2, l: 'Små forbedringer', h: 'Rydde, male, bedre lys' },
  { v: 3, l: 'Åpen for større endringer', h: 'Noen rom kan få ny bruk' },
  { v: 4, l: 'Ønsker store endringer', h: 'Tenk nytt om hele kjelleren og loftet' }
];

PG8.VEDLIKEHOLD = [
  { v: 'vinduer', l: 'Utskifting av gamle vinduer' },
  { v: 'ventilasjon', l: 'Ventilasjon og lukt' },
  { v: 'lys', l: 'Belysning' },
  { v: 'las', l: 'Låser og sikkerhet' },
  { v: 'overflater', l: 'Maling, gulv og vegger' },
  { v: 'el', l: 'Elektrisk anlegg' },
  { v: 'dorer', l: 'Dører i fellesarealene' },
  { v: 'trapper', l: 'Trapper og rekkverk' },
  { v: 'rydding', l: 'Rydding og kasting av gamle ting' },
  { v: 'tilgjengelig', l: 'Bedre tilgjengelighet for de som går dårlig' },
  { v: 'fuktsikring', l: 'Fuktsikring' },
  { v: 'annet', l: 'Annet' }
];

PG8.KOSTNAD = [
  { v: '0', l: 'Ingen økning' },
  { v: '1-100', l: 'Opptil 100 kr i måneden' },
  { v: '100-300', l: '100–300 kr i måneden' },
  { v: '300-500', l: '300–500 kr i måneden' },
  { v: '500+', l: 'Mer enn 500 kr i måneden' },
  { v: 'vet_ikke', l: 'Vet ikke' }
];

PG8.VIDERE = [
  { v: 'arbeidsgruppe', l: 'Være med i en arbeidsgruppe' },
  { v: 'dugnad', l: 'Hjelpe til på dugnad' },
  { v: 'kontaktes', l: 'Bli kontaktet for en kort prat' }
];

/* Arealtilpassede lister: felles valg + det som bare gjelder ett areal (settes inn før «Annet»/«Ingen problemer») */
function medEkstra(liste, ekstra, foran) {
  if (!ekstra) return liste;
  const i = liste.findIndex(function (x) { return x.v === foran; });
  return liste.slice(0, i).concat(ekstra, liste.slice(i));
}
PG8.problemerFor = function (a) { return medEkstra(PG8.PROBLEMER, a.problemerEkstra, 'ingen'); };
PG8.hvorforIkkeFor = function (a) { return medEkstra(PG8.HVORFOR_IKKE, a.hvorforIkkeEkstra, 'annet'); };

/* ---------- Stegene ---------- */
PG8.byggSteg = function () {
  const steg = [];

  steg.push({ id: 'velkommen', type: 'velkommen' });

  steg.push({
    id: 'om', tittel: 'Litt om deg', ingress: 'Dette hjelper oss å se om ulike beboere har ulike behov. Du er fortsatt anonym.',
    sporsmal: [
      { key: 'om.etasje', type: 'single', layout: 'rad', label: 'Hvilken etasje bor du i?', valg: [
        { v: 'kjeller', l: 'U.etg.' }, { v: '1', l: '1. etg.' }, { v: '2', l: '2. etg.' }, { v: '3', l: '3. etg.' }] },
      { key: 'om.botid', type: 'single', layout: 'rad', label: 'Hvor lenge har du bodd her?', valg: [
        { v: '0-2', l: 'Under 2 år' }, { v: '2-5', l: '2–5 år' }, { v: '5-15', l: '5–15 år' }, { v: '15+', l: 'Over 15 år' }] },
      { key: 'om.alder', type: 'single', layout: 'rad', label: 'Hvor gammel er du?', valg: [
        { v: '-30', l: 'Under 30' }, { v: '30-49', l: '30–49' }, { v: '50-66', l: '50–66' }, { v: '67+', l: '67 eller eldre' }] },
      { key: 'om.husstand', type: 'multi', label: 'Hvem bor i husstanden din?', hjelp: 'Velg alt som passer.', valg: [
        { v: 'alene', l: 'Jeg bor alene' }, { v: 'voksne', l: 'Flere voksne' }, { v: 'barn', l: 'Barn under 13' },
        { v: 'ungdom', l: 'Ungdom 13–19' }, { v: 'dyr', l: 'Kjæledyr' }] },
      { key: 'om.eier', type: 'single', layout: 'rad', label: 'Eier eller leier du?', valg: [
        { v: 'eier', l: 'Eier' }, { v: 'leier', l: 'Leier' }] },
      { key: 'om.vaskemaskin', type: 'single', layout: 'rad', label: 'Har du vaskemaskin i leiligheten?', valg: [
        { v: 'ja', l: 'Ja' }, { v: 'nei', l: 'Nei' }] },
      { key: 'om.torketrommel', type: 'single', layout: 'rad', label: 'Har du tørketrommel eller tørkeskap i leiligheten?', valg: [
        { v: 'ja', l: 'Ja' }, { v: 'nei', l: 'Nei' }] },
      { key: 'om.peis', type: 'single', layout: 'rad', label: 'Har du peis eller vedovn?', valg: [
        { v: 'ja', l: 'Ja' }, { v: 'nei', l: 'Nei' }] }
    ]
  });

  PG8.AREALER.forEach(function (a, i) {
    const k = 'areal.' + a.id + '.';
    const bruker = function (s) { return s[k + 'frekvens'] > 0; };
    const aldri = function (s) { return s[k + 'frekvens'] === 0; };
    const svart = function (s) { return s[k + 'frekvens'] !== undefined; };
    steg.push({
      id: a.id, areal: a, overtittel: 'Areal ' + (i + 1) + ' av ' + PG8.AREALER.length,
      tittel: a.navn, ingress: a.info, sporsmal: [
        { key: k + 'frekvens', type: 'single', label: 'Hvor ofte bruker du ' + a.navn.toLowerCase() + '?', valg: PG8.FREKVENS },
        { key: k + 'hvorfor_ikke', type: 'multi', label: 'Hvorfor bruker du det ikke?', hjelp: 'Velg alt som passer.', valg: PG8.hvorforIkkeFor(a), vis: aldri },
        { key: k + 'bruk', type: 'multi', label: 'Hva bruker du det til?', hjelp: 'Velg alt som passer.', valg: a.bruk, vis: bruker },
        { key: k + 'tilstand', type: 'faces', label: 'Hvordan fungerer det i dag?', valg: PG8.TILSTAND, vis: bruker },
        { key: k + 'problemer', type: 'multi', label: 'Er det noe som er dårlig?', hjelp: 'Velg alt som passer.', valg: PG8.problemerFor(a), vis: bruker },
        { key: k + 'viktighet', type: 'single', layout: 'rad', label: 'Hvor viktig er dette arealet for deg?', valg: PG8.VIKTIGHET, vis: svart },
        { key: k + 'kommentar', type: 'text', label: 'Vil du si noe mer om ' + a.navn.toLowerCase() + '?', hjelp: 'Valgfritt. Ikke skriv navn på andre.', vis: svart }
      ]
    });
  });

  steg.push({
    id: 'behov', tittel: 'Hva trenger du?', ingress: 'Glem dagens rom et øyeblikk. Hvor viktig er disse tingene for deg?',
    sporsmal: [{ key: 'behov', type: 'matrise', rader: PG8.BEHOV, valg: PG8.BEHOV_SKALA }]
  });

  steg.push({
    id: 'topp3', tittel: 'Dine tre viktigste', ingress: 'Hvis sameiet bare kunne gjøre tre ting, hva skulle det vært?',
    sporsmal: [{ key: 'topp3', type: 'pick', maks: 3, label: 'Velg inntil tre.',
      filtrertHjelp: 'Her ser du behovene du merket som «svært viktig».',
      valg: function (s) {
        const viktige = PG8.BEHOV.filter(function (b) { return s['behov.' + b.id] === 3; });
        return (viktige.length >= 2 ? viktige : PG8.BEHOV).map(function (b) { return { v: b.id, l: b.l }; });
      } }]
  });

  steg.push({
    id: 'endring', tittel: 'Endring', ingress: 'Det finnes ingen riktige svar her.',
    sporsmal: [
      { key: 'endring', type: 'single', label: 'Hvor åpen er du for å endre bruken av fellesarealene?', valg: PG8.ENDRING },
      { key: 'ide', type: 'text', label: 'Har du en idé til hvordan et areal kan brukes bedre?', hjelp: 'For eksempel: «Tørkerommet på loftet kan bli sykkelrom.»' }
    ]
  });

  steg.push({
    id: 'vedlikehold', tittel: 'Vedlikehold og kostnader', ingress: 'Bygningen trenger vedlikehold uansett. Styret lager en samlet plan til årsmøtet.',
    sporsmal: [
      { key: 'vedlikehold', type: 'multi', label: 'Hva er viktigst å utbedre?', hjelp: 'Velg alt som passer.', valg: PG8.VEDLIKEHOLD },
      { key: 'kostnad', type: 'single', label: 'Hvor mye mer i felleskostnader ville du vært villig til å betale for bedre fellesarealer?', hjelp: 'Per husstand. Dette er ikke bindende – det hjelper oss å lage realistiske forslag.', valg: PG8.KOSTNAD }
    ]
  });

  steg.push({
    id: 'videre', tittel: 'Veien videre', ingress: 'Etter denne runden lager vi konkrete forslag som alle kan si sin mening om.',
    sporsmal: [
      { key: 'videre', type: 'multi', label: 'Vil du bidra?', hjelp: 'Helt frivillig.', valg: PG8.VIDERE },
      { key: 'kontakt', type: 'kontakt', label: 'Hvordan kan vi nå deg?', hjelp: 'Lagres for seg, og kobles ikke til svarene dine.',
        vis: function (s) { return (s.videre || []).length > 0; } }
    ]
  });

  steg.push({
    id: 'fritt', tittel: 'Noe mer?', sporsmal: [
      { key: 'fritt', type: 'text', label: 'Er det noe vi ikke har spurt om, som du mener er viktig?', stor: true }
    ]
  });

  steg.push({ id: 'oppsummering', type: 'oppsummering', tittel: 'Se over svarene dine' });
  steg.push({ id: 'takk', type: 'takk' });
  return steg;
};
