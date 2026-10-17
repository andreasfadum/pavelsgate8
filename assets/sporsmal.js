/* Spørsmålsdefinisjon – runde 1 (kartlegging).
   Alt innhold i skjemaet ligger her som data. Neste runde = ny fil med samme struktur. */
window.PG8 = window.PG8 || {};

PG8.CONFIG = {
  runde: 1,
  versjon: '1.0',
  nullstilt: 2,           // Økes for å nullstille kladder og testsvar som ligger lagret i nettleserne
  utsendt: '2026-10-17',  // Dato meldingen sendes ut
  svarfrist: '2026-10-26',// Fristen som står i teksten (mandag 26. oktober)
  stengt: '2026-10-28T00:00:00+01:00', // I praksis åpent ut 27. oktober. Må stemme med STENGT i Kode.gs
  svarfristDager: 7,      // Brukes bare hvis svarfrist ikke er satt
  husstander: 10,         // Ti leiligheter
  minVisning: 5,          // Resultater vises først fra 5 svar (håndheves også i Apps Script)
  endpoint: 'https://script.google.com/macros/s/AKfycbyMDr9r-M8JB2eNknJs1O_b2n_O2ahYBsrTIyz7nkTCCLvuyEWs_aGxwMe40t6iCfSYIg/exec',           // Web app-URL fra Apps Script (slutter på /exec). Tom = prototype med eksempeldata.
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
  fyrrom: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8"/><path d="M12 18c-1.8 0-3-1.2-3-2.8 0-1.7 1.5-2.6 1.7-4.4 1 .7 1.6 1.6 1.7 2.4.4-.4.7-1.1.7-1.8 1.2.9 1.9 2.2 1.9 3.6 0 1.7-1.2 3-3 3z"/>',
  skratak: '<path d="M2 20.5h20"/><path d="M4 20.5 14.5 5H21v15.5"/><rect x="11" y="15" width="5" height="5.5" rx=".6"/><rect x="15.5" y="10.5" width="4" height="4.5" rx=".6"/>',
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
  { id: 'loft_skratak', navn: 'Lagringsarealet under skråtaket på loftet', kort: 'Skråtak loft', sted: 'Loft', ikon: 'skratak', bruk: [
    { v: 'sesong', l: 'Sesongting (jul, klær)' },
    { v: 'sport', l: 'Sport og friluft' },
    { v: 'sjelden', l: 'Ting jeg sjelden bruker' },
    { v: 'store', l: 'Store ting som ikke får plass i boden' },
    { v: 'annet', l: 'Annet' }
  ] },
  { id: 'vaskerom', navn: 'Vaskerommet', kort: 'Vaskerom', sted: 'Underetasje', ikon: 'vask',
    info: 'Vaskemaskin som reserveres på tavla. Vi spør for å finne ut hvordan vaskeriet kan fungere best mulig for dem som bruker det.',
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
  ] },
  { id: 'fyrrom', navn: 'Det gamle fyrrommet i kjelleren', kort: 'Gammelt fyrrom', sted: 'Kjeller', ikon: 'fyrrom', bruk: [
    { v: 'lagring', l: 'Lagring av egne ting' },
    { v: 'sykkel', l: 'Sykkel' },
    { v: 'barn', l: 'Barnevogn / barneutstyr' },
    { v: 'felles', l: 'Felles utstyr og dugnad' },
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
  { id: 'oppbevaring', l: 'Privat bodplass og lagring' },
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

PG8.UTE_FREKVENS = [
  { v: 0, l: 'Aldri' },
  { v: 1, l: 'Noen ganger i sesongen' },
  { v: 2, l: 'Omtrent hver måned' },
  { v: 3, l: 'Hver uke' },
  { v: 4, l: 'Flere ganger i uka' }
];
PG8.UTE_ONSKER = [
  { v: 'sittegrupper', l: 'Flere sittegrupper', h: 'Til opphold, nyte sola og spise middag ute.',
    under: [{ v: 'tak', l: 'Med tak eller le for været' }, { v: 'langbord', l: 'Langbord for større lag' }, { v: 'sma', l: 'Små hjørner for to–fire' }, { v: 'skygge', l: 'Skygge (parasoll eller pergola)' }] },
  { v: 'glasspaviljong', l: 'Glasspaviljong', h: 'Et lunt rom av glass der vi kan sitte ute også høst og vinter.',
    under: [{ v: 'sosialt', l: 'Til selskap og samvær' }, { v: 'ro', l: 'Til ro og lesing' }, { v: 'varme', l: 'Med varme om vinteren' }, { v: 'booking', l: 'Kan reserveres av beboerne' }] },
  { v: 'drivhus', l: 'Minidrivhus', h: 'For dyrking av planter og spiselige vekster.',
    under: [{ v: 'felles', l: 'Felles drivhus vi deler' }, { v: 'egen', l: 'Egen plass i drivhuset' }, { v: 'stelle', l: 'Jeg vil være med og stelle det' }] },
  { v: 'dyrking', l: 'Dyrkekasser / kjøkkenhage', h: 'For dyrking av planter og spiselige vekster.',
    under: [{ v: 'egen', l: 'Egen kasse for husstanden' }, { v: 'felles', l: 'Felles kjøkkenhage' }, { v: 'urter', l: 'Urter og grønnsaker' }, { v: 'baer', l: 'Bær og frukt' }] },
  { v: 'beplantning', l: 'Mer beplantning og blomster', h: 'Blomster, busker og grønt som gjør hagen frodigere.',
    under: [{ v: 'blomster', l: 'Blomster' }, { v: 'busker', l: 'Busker og hekk' }, { v: 'frukttraer', l: 'Frukttrær' }, { v: 'insekter', l: 'Insektvennlige planter' }] },
  { v: 'trening', l: 'Treningsapparater', h: 'Hvis det er interesse, ser vi på hva slags apparater i en senere fase.',
    under: [{ v: 'styrke', l: 'Styrke' }, { v: 'bevegelighet', l: 'Bevegelighet og balanse' }, { v: 'alle', l: 'Tilpasset alle aldre' }] },
  { v: 'sykkel', l: 'Sykkelparkering', h: 'Mer om sykler på neste side.',
    under: [{ v: 'tak', l: 'Under tak' }, { v: 'las', l: 'Med mulighet for fastlåsing' }, { v: 'transport', l: 'Plass til transportsykkel' }] },
  { v: 'torkestativ', l: 'Tørkestativ', h: 'For å henge klær til tørk ute.',
    under: [{ v: 'fast', l: 'Fast stativ' }, { v: 'sammenleggbart', l: 'Sammenleggbart stativ' }, { v: 'snorer', l: 'Tørkesnorer' }] },
  { v: 'grill', l: 'Grillplass', h: 'Et fast sted å grille og samles.',
    under: [{ v: 'murt', l: 'Fast murt grill' }, { v: 'gass', l: 'Gassgrill' }, { v: 'bal', l: 'Bålpanne' }, { v: 'benker', l: 'Benker rundt' }] },
  { v: 'lek', l: 'Lek for barn', h: 'Et område eller apparater for lek.',
    under: [{ v: 'sma', l: 'For små barn' }, { v: 'store', l: 'For større barn' }, { v: 'sandkasse', l: 'Sandkasse' }, { v: 'huske', l: 'Huske eller klatrestativ' }] },
  { v: 'lys', l: 'Bedre belysning ute', h: 'Lys som gjør det tryggere og hyggeligere å ferdes ute når det er mørkt.',
    under: [{ v: 'gangvei', l: 'Langs gangveiene' }, { v: 'inngang', l: 'Ved inngangen' }, { v: 'sitte', l: 'Ved sittegruppene' }, { v: 'stemning', l: 'Stemningsbelysning' }] },
  { v: 'annet', l: 'Annet', h: 'Skriv gjerne hva i feltet under.' },
  { v: 'fornoyd', l: 'Jeg er fornøyd slik det er', eksklusiv: true }
];

PG8.SYKKEL_ANTALL = [{ v: 0, l: 'Ingen' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4+' }];
PG8.SYKKEL_TYPER = [
  { v: 'vanlig', l: 'Vanlig sykkel' },
  { v: 'el', l: 'Elsykkel' },
  { v: 'transport', l: 'Transportsykkel / lastesykkel' },
  { v: 'barn', l: 'Barnesykkel' },
  { v: 'tilhenger', l: 'Sykkelvogn eller tilhenger' }
];
PG8.SYKKEL_I_DAG = [
  { v: 'privat_bod', l: 'I privat bod' },
  { v: 'felles', l: 'I felles bod eller fellesareal' },
  { v: 'leilighet', l: 'I leiligheten' },
  { v: 'ute', l: 'Ute i gården' },
  { v: 'annet', l: 'Et annet sted' }
];
PG8.SYKKEL_LAS = [
  { v: 'rom', l: 'Låst rom eller sykkelbod', h: 'Bare beboerne har nøkkel' },
  { v: 'stativ', l: 'Stativ der rammen kan låses fast' },
  { v: 'vanlig', l: 'Vanlig sykkellås er nok' },
  { v: 'vet_ikke', l: 'Vet ikke' }
];
PG8.SYKKEL_SKAP = [
  { v: 'utstyr', l: 'Tørt skap til utstyr', h: 'Hjelm, regntøy, sete, verktøy',
    under: [{ v: 'naer', l: 'Rett ved sykkelparkeringen' }, { v: 'fritt', l: 'Kan stå et annet sted' }], underType: 'single', underLabel: 'Hvor bør skapet stå?' },
  { v: 'lading', l: 'Lading av batteri til elsykkel',
    under: [{ v: 'naer', l: 'Rett ved sykkelparkeringen' }, { v: 'fritt', l: 'Kan være et annet sted' }], underType: 'single', underLabel: 'Hvor bør ladingen være?' },
  { v: 'ingen', l: 'Ikke behov', eksklusiv: true }
];
PG8.TOPP3_RETNING = [
  { v: 'ta_vare', l: 'Ta vare på det vi har' },
  { v: 'forbedre', l: 'Gjøre det bedre' },
  { v: 'nytt', l: 'Få mer av det, eller noe nytt' }
];

PG8.ENDRING = [
  { v: 1, l: 'Behold som i dag', h: 'Jeg er fornøyd slik det er' },
  { v: 2, l: 'Små forbedringer', h: 'Rydde, male, bedre lys' },
  { v: 3, l: 'Større oppgradering', h: 'Tilpasse rommene bedre, og kanskje flytte noen funksjoner' },
  { v: 4, l: 'Tenke helhetlig', h: 'Se underetasjen, kjelleren og loftet under ett, og organisere rommene på nytt' }
];

PG8.VEDLIKEHOLD = [
  { v: 'vinduer', l: 'Utskifting av gamle vinduer' },
  { v: 'fasade', l: 'Fasade' },
  { v: 'isolasjon', l: 'Isolasjon' },
  { v: 'energi', l: 'Energieffektivisering' },
  { v: 'balkonger', l: 'Balkonger' },
  { v: 'luftebalkonger', l: 'Luftebalkonger' },
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
  { v: '0-500', l: '0–500 kr i måneden' },
  { v: '500-1000', l: '500–1000 kr i måneden' },
  { v: '1000-2000', l: '1000–2000 kr i måneden' },
  { v: '2000+', l: 'Over 2000 kr i måneden' }
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

/* Holder prioriteringene i takt med det som er krysset av */
PG8.rydd = function (s) {
  const viktig = s.viktig || [];
  if (s.topp3) s.topp3 = s.topp3.filter(function (id) { return viktig.indexOf(id) > -1; });
  if (s.neste3) s.neste3 = s.neste3.filter(function (id) { return viktig.indexOf(id) > -1 && (s.topp3 || []).indexOf(id) === -1; });
  if ((s.topp3 || []).length < 3 || viktig.length <= 3) delete s.neste3;
};

/* ---------- Stegene ---------- */
PG8.byggSteg = function () {
  const steg = [];
  const harSykkel = function (s) { return s['sykkel.antall'] > 0; };

  steg.push({ id: 'velkommen', type: 'velkommen' });

  steg.push({
    id: 'om', tittel: 'Litt om deg', ingress: 'Dette hjelper oss å se om ulike beboere har ulike behov. Du er fortsatt anonym.',
    sporsmal: [
      { key: 'om.botid', type: 'single', layout: 'rad', label: 'Hvor lenge har du bodd her?', valg: [
        { v: '0-2', l: 'Under 2 år' }, { v: '2-5', l: '2–5 år' }, { v: '5-15', l: '5–15 år' }, { v: '15+', l: 'Over 15 år' }] },
      { key: 'om.husstand', type: 'multi', label: 'Hvem bor i husstanden din?', hjelp: 'Velg alt som passer.', valg: [
        { v: 'alene', l: 'Jeg bor alene' }, { v: 'voksne', l: 'Flere voksne' }, { v: 'barn', l: 'Barn under 13' },
        { v: 'ungdom', l: 'Ungdom 13–19' }, { v: 'dyr', l: 'Kjæledyr' }] },
      { key: 'om.eier', type: 'single', layout: 'rad', label: 'Eier eller leier du?', valg: [
        { v: 'eier', l: 'Eier' }, { v: 'leier', l: 'Leier' }] },
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

  /* Det viktigste: kryss av så mange du vil (med retning), marker så de tre viktigste (påkrevd),
     og eventuelt de tre nest viktigste. */
  const iListe = function (s, ider) {
    return PG8.BEHOV.filter(function (b) { return ider.indexOf(b.id) > -1; }).map(function (b) { return { v: b.id, l: b.l }; });
  };
  steg.push({
    id: 'viktigst', tittel: 'Det viktigste for deg',
    ingress: 'Det kan være noe vi har i dag og må ta vare på, eller noe som bør bli bedre eller komme i tillegg.',
    sporsmal: [
      { key: 'viktig', type: 'multi', label: 'Hva er viktig for deg?',
        hjelp: 'Kryss av så mange du vil. For hvert valg kan du si om det handler om å ta vare på, gjøre bedre eller få noe nytt.',
        valg: function (s) {
          // Det du merket som svært viktig eller kjekt å ha står først
          const rang = function (b) { return { 3: 0, 2: 1 }[s['behov.' + b.id]] === undefined ? 2 : { 3: 0, 2: 1 }[s['behov.' + b.id]]; };
          return PG8.BEHOV.slice().sort(function (a, b) { return rang(a) - rang(b); }).map(function (b) {
            return { v: b.id, l: b.l, under: PG8.TOPP3_RETNING, underType: 'single', underLabel: 'Hva ønsker du for dette?' };
          });
        },
        krav: function (s) { return (s.viktig || []).length ? '' : 'Kryss av for minst én ting som er viktig for deg.'; } },
      { key: 'topp3', type: 'pick', maks: 3, merke: 'Prioritet 1', label: 'Hvilke tre er aller viktigst?',
        hjelp: 'Velg blant det du krysset av over. Dette spørsmålet må besvares.',
        vis: function (s) { return (s.viktig || []).length > 0; },
        valg: function (s) { return iListe(s, s.viktig || []); },
        krav: function (s) {
          const trengs = Math.min(3, (s.viktig || []).length);
          return (s.topp3 || []).length >= trengs ? '' : (trengs === 1 ? 'Marker det som er aller viktigst.' : 'Marker de ' + (trengs === 2 ? 'to' : 'tre') + ' som er aller viktigst.');
        } },
      { key: 'neste3', type: 'pick', maks: 3, valgfri: true, merke: 'Prioritet 2', label: 'Vil du også velge de tre nest viktigste?',
        hjelp: 'Valgfritt. Dette er prioriteringene som kommer rett etter de tre viktigste.',
        vis: function (s) { return (s.topp3 || []).length === 3 && (s.viktig || []).length > 3; },
        valg: function (s) { return iListe(s, (s.viktig || []).filter(function (id) { return (s.topp3 || []).indexOf(id) === -1; })); } }
    ]
  });

  steg.push({
    id: 'ute', tittel: 'Utearealene', ingress: 'Forhagen, bakgården og de andre utearealene rundt huset.',
    sporsmal: [
      { key: 'ute.frekvens', type: 'single', label: 'Hvor ofte bruker du utearealene i sommerhalvåret?', valg: PG8.UTE_FREKVENS },
      { key: 'ute.onsker', type: 'multi', label: 'Ønsker du flere eller andre tilbud i utearealene?', hjelp: 'Velg alt som passer.', valg: PG8.UTE_ONSKER },
      { key: 'ute.kommentar', type: 'text', label: 'Har du andre ønsker eller ideer for utearealene?', hjelp: 'Valgfritt.' }
    ]
  });

  steg.push({
    id: 'sykkel', tittel: 'Sykler', ingress: 'Vi vil vite mer om sykkelbehovet, så vi kan planlegge riktig antall plasser og riktig type.',
    sporsmal: [
      { key: 'sykkel.antall', type: 'single', layout: 'rad', label: 'Hvor mange sykler har husstanden din?', hjelp: 'Du kan også ta med sykler du planlegger å kjøpe.', valg: PG8.SYKKEL_ANTALL },
      { key: 'sykkel.typer', type: 'multi', label: 'Hva slags sykler er det?', hjelp: 'Velg alt som passer.', valg: PG8.SYKKEL_TYPER, vis: harSykkel },
      { key: 'sykkel.i_dag', type: 'multi', label: 'Hvor står syklene i dag?', hjelp: 'Velg alt som passer.', valg: PG8.SYKKEL_I_DAG, vis: harSykkel },
      { key: 'sykkel.las', type: 'single', label: 'Hvilket behov har du for trygg låsing?', valg: PG8.SYKKEL_LAS, vis: harSykkel },
      { key: 'sykkel.skap', type: 'multi', label: 'Har du behov for et tørt skap til sykkelutstyr eller lading?', hjelp: 'Velg alt som passer.', valg: PG8.SYKKEL_SKAP, vis: harSykkel },
      { key: 'sykkel.kommentar', type: 'text', label: 'Noe mer om sykler?', hjelp: 'Valgfritt.', vis: harSykkel }
    ]
  });

  steg.push({
    id: 'endring', tittel: 'Endring', ingress: 'Det finnes ingen riktige svar her.',
    sporsmal: [
      { key: 'endring', type: 'single', label: 'Hvor åpen er du for å endre bruken av fellesarealene?', valg: PG8.ENDRING },
      { key: 'endring.kommentar', type: 'text', label: 'Vil du utdype svaret ditt?', hjelp: 'Valgfritt. Du kan skrive her uansett hva du har krysset av.' },
      { key: 'ide', type: 'text', label: 'Har du en idé til hvordan et areal kan brukes bedre?', hjelp: 'For eksempel: «Lagringsarealet under skråtaket kunne fått hyller og bedre lys.»' }
    ]
  });

  steg.push({
    id: 'vedlikehold', tittel: 'Vedlikehold og oppgradering', ingress: 'Bygningen trenger vedlikehold uansett. Styret lager en samlet plan til årsmøtet.',
    sporsmal: [
      { key: 'vedlikehold', type: 'multi', label: 'Hva mener du er viktigst å utbedre eller oppgradere?', hjelp: 'Velg alt som passer.', valg: PG8.VEDLIKEHOLD }
    ]
  });

  // Balkong: bare for de få leilighetene det kan være aktuelt for. Vises ikke på oversikten (for få svar til å være anonymt).
  const balkongAktuelt = function (s) { return s['balkong.aktuelt'] === 'ja'; };
  steg.push({
    id: 'balkong', tittel: 'Balkong',
    ingress: 'Det kan bli aktuelt å se på nye balkonger for noen av leilighetene. Vi vil gjerne vite om det er interesse hos dem det gjelder.',
    sporsmal: [
      { key: 'balkong.aktuelt', type: 'single', label: 'Bor du i en leilighet der ny balkong kan være aktuelt?', valg: [
        { v: 'ja', l: 'Ja' }, { v: 'nei', l: 'Nei' }, { v: 'vet_ikke', l: 'Vet ikke' }] },
      { key: 'balkong.interesse', type: 'single', label: 'Hvor interessert er du i å få balkong?', vis: balkongAktuelt, valg: [
        { v: 'svaert', l: 'Svært interessert' }, { v: 'litt', l: 'Litt interessert' }, { v: 'ikke', l: 'Ikke interessert' }, { v: 'vet_ikke', l: 'Vet ikke ennå' }] },
      { key: 'balkong.kommentar', type: 'text', label: 'Er det noe som er viktig for deg ved en eventuell balkong?', hjelp: 'Valgfritt. For eksempel størrelse, plassering eller kostnad.', vis: balkongAktuelt }
    ]
  });

  steg.push({
    id: 'kostnader', tittel: 'Felleskostnader', ingress: 'Vedlikehold og forbedringer koster penger. Svaret ditt hjelper oss å lage forslag i ulike prisklasser.',
    sporsmal: [
      { key: 'kostnad', type: 'single', label: 'Hvor mye mer i felleskostnader ville du vært villig til å betale for bedre fellesarealer?', hjelp: 'Per husstand. Dette er ikke bindende – det hjelper oss å lage realistiske forslag.', valg: PG8.KOSTNAD }
    ]
  });

  steg.push({
    id: 'videre', tittel: 'Veien videre', ingress: 'Etter denne runden lager vi konkrete forslag som alle kan si sin mening om.',
    sporsmal: [
      { key: 'videre', type: 'multi', valgfri: true, label: 'Vil du bidra?', hjelp: 'Helt frivillig.', valg: PG8.VIDERE },
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
