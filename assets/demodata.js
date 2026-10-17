/* DEMODATA – kun for prototypen. Fjernes når skjemaet kobles til Google Sheet. */
(function () {
  let frø = 8;
  function tilfeldig() { // mulberry32 – samme demodata hver gang
    frø |= 0; frø = frø + 0x6D2B79F5 | 0;
    let t = Math.imul(frø ^ frø >>> 15, 1 | frø);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function vekt(v) { // v = [w0, w1, ...] → indeks
    const sum = v.reduce(function (a, b) { return a + b; }, 0);
    let r = tilfeldig() * sum;
    for (let i = 0; i < v.length; i++) { r -= v[i]; if (r < 0) return i; }
    return v.length - 1;
  }
  function noen(sannsynlighet) {
    return Object.keys(sannsynlighet).filter(function (k) { return tilfeldig() < sannsynlighet[k]; });
  }

  const profil = {
    boder_kjeller:    { f: [1, 4, 5, 3, 0], t: [2, 5, 4, 2, 0], p: { fukt: .55, lys: .4, plass: .3, rot: .5 }, h: { tilstand: .5, ikke_behov: .5 }, b: { sesong: .7, sport: .5, sykkel: .3, dekk: .3, sjelden: .5 } },
    boder_loft:       { f: [3, 7, 3, 1, 0], t: [0, 2, 6, 4, 1], p: { kaldt: .3, adkomst: .45, rot: .35, lys: .3 }, h: { adkomst: .6, ikke_behov: .4 }, b: { sesong: .8, sjelden: .6, barn: .2 } },
    vaskerom:         { f: [10, 2, 2, 4, 1], t: [3, 5, 3, 1, 0], p: { utstyr: .6, skittent: .35, fukt: .2 }, h: { har_eget: .9, tilstand: .2 }, b: { klesvask: .8, store: .5 } },
    torkerom_kjeller: { f: [7, 3, 4, 4, 1], t: [3, 6, 3, 1, 0], p: { fukt: .45, snorer: .3, plass: .25, rot: .3, lys: .2 }, h: { har_eget: .6, tilstand: .35 }, b: { klaer: .8, store: .5, friluft: .3 } },
    torkerom_loft:    { f: [12, 3, 2, 1, 0], t: [0, 2, 4, 3, 0], p: { adkomst: .6, kaldt: .3, snorer: .25 }, h: { adkomst: .5, har_eget: .4, visste_ikke: .25 }, b: { store: .6, klaer: .5 } },
    vedbod:           { f: [14, 3, 1, 1, 0], t: [0, 1, 3, 3, 1], p: { rot: .4 }, h: { ikke_behov: .6, ved_direkte: .5 }, b: { ved: .95 } },
    redskapsbod:      { f: [8, 9, 2, 0, 0], t: [1, 4, 4, 2, 0], p: { rot: .55, las: .2, lys: .25 }, h: { ikke_behov: .5, visste_ikke: .35, tilgang: .2 }, b: { snø: .5, dugnad: .6, hage: .4, verktoy: .3 } },
    loft_skratak:     { f: [9, 6, 2, 0, 0], t: [1, 3, 4, 2, 0], p: { adkomst: .5, lys: .4, rot: .3 }, h: { visste_ikke: .4, ikke_behov: .5 }, b: { sesong: .6, sjelden: .6, store: .3 } },
    fyrrom:           { f: [11, 4, 2, 1, 0], t: [3, 4, 3, 1, 0], p: { rot: .5, lys: .4, fukt: .2 }, h: { visste_ikke: .5, tilgang: .4, ikke_behov: .3 }, b: { lagring: .5, felles: .5, sykkel: .2 } }
  };
  const behovVekt = {
    oppbevaring: [1, 3, 6], sykkel: [2, 3, 6], lading: [4, 3, 3], barnevogn: [6, 2, 2], klesvask: [5, 3, 3],
    torking: [2, 4, 5], sosialt: [3, 4, 4], deling: [2, 5, 4], verksted: [5, 4, 2], kontor: [7, 3, 1],
    trening: [7, 3, 1], gjesterom: [5, 4, 2], pakker: [3, 4, 4], gjenbruk: [2, 5, 4], ved: [9, 2, 1]
  };

  const svar = [];
  for (let i = 0; i < 17; i++) {
    const s = { runde: 1, versjon: '1.0' };
    s['om.alder'] = ['-30', '30-49', '50-66', '67+'][vekt([3, 7, 4, 3])];
    PG8.AREALER.forEach(function (a) {
      const p = profil[a.id], k = 'areal.' + a.id + '.';
      if (tilfeldig() < .06) return; // noen hopper over
      const f = vekt(p.f);
      s[k + 'frekvens'] = f;
      if (f === 0) s[k + 'hvorfor_ikke'] = noen(p.h);
      else {
        s[k + 'bruk'] = noen(p.b);
        s[k + 'tilstand'] = vekt(p.t) + 1;
        const pr = noen(p.p);
        s[k + 'problemer'] = pr.length ? pr : ['ingen'];
      }
      s[k + 'viktighet'] = f >= 2 ? 3 - vekt([5, 3, 1]) : 1 + vekt([4, 3, 1]);
    });
    PG8.BEHOV.forEach(function (b) { s['behov.' + b.id] = vekt(behovVekt[b.id]) + 1; });
    const viktige = PG8.BEHOV.filter(function (b) { return s['behov.' + b.id] === 3; }).map(function (b) { return b.id; });
    s.topp3 = viktige.sort(function () { return tilfeldig() - .5; }).slice(0, 3);
    s.endring = vekt([2, 6, 6, 3]) + 1;
    s['ute.frekvens'] = vekt([2, 4, 4, 5, 2]);
    s['ute.onsker'] = noen({ sittegrupper: .55, drivhus: .3, dyrking: .35, beplantning: .45, trening: .15, sykkel: .5, torkestativ: .3, grill: .35, lek: .2, lys: .3 });
    s.kostnad = ['0', '0-500', '500-1000', '1000-2000', '2000+'][vekt([3, 6, 5, 2, 1])];
    s.vedlikehold = noen({ vinduer: .65, fasade: .5, isolasjon: .4, energi: .45, balkonger: .35, luftebalkonger: .2, fuktsikring: .3, ventilasjon: .45, lys: .55, las: .3, overflater: .35, el: .15, dorer: .2, trapper: .1, rydding: .6, tilgjengelig: .2 });
    svar.push(s);
  }
  PG8.DEMO_SVAR = svar;

  /* Fritekst som styret har godkjent for publisering */
  PG8.DEMO_SITATER = [
    { tekst: 'Tørkerommet i kjelleren lukter fuktig, så jeg tørker heller klær i stua. Hadde brukt det mye mer med en avfukter.', felt: 'areal.torkerom_kjeller.kommentar' },
    { tekst: 'Vi har tre sykler og en sykkelvogn stående i gangen. Et låsbart sykkelrom ville gjort hverdagen mye enklere.', felt: 'fritt' },
    { tekst: 'Loftet er fint, men trappene er tunge å gå med tøykurv. Kanskje loftet passer bedre til boder enn tørking?', felt: 'ide' },
    { tekst: 'Det står mye gammelt rot i bodene som ingen eier. En felles ryddedag med container hadde gitt mye plass.', felt: 'areal.boder_kjeller.kommentar' },
    { tekst: 'Et lite rom der vi kan møtes, ha bursdag eller årsmøte, hadde vært koselig.', felt: 'fritt' }
  ];

  /* Styrets kjente vedlikeholdsbehov – eksempler, erstattes med styrets liste */
  PG8.DEMO_VEDLIKEHOLD = [
    { l: 'Fukt i ytterveggen i underetasjen', status: 'Må utbedres' },
    { l: 'Gammel belysning uten bevegelsessensor i kjeller og loft', status: 'Må utbedres' },
    { l: 'Ventilasjon i tørkerom og vaskerom', status: 'Vurderes' },
    { l: 'Låssystem på kjeller- og loftsdører', status: 'Vurderes' },
    { l: 'Maling av vegger og gulv i fellesarealer', status: 'Vurderes' }
  ];
})();
