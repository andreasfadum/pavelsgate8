/* Felles oversikt: henter samlede resultater (fra Apps Script, eller eksempeldata i prototypen) og tegner siden. */
(function () {
  const C = PG8.CONFIG;
  const esc = PG8.esc;
  PG8.initTekst();

  const mittLagret = PG8.hent(PG8.nokkel('sendt'));
  const mineSvar = !mittLagret ? [] : Array.isArray(mittLagret) ? mittLagret.map(function (x) { return x.data; }) : [mittLagret.data || mittLagret];
  const mitt = mineSvar.length ? mineSvar[mineSvar.length - 1] : null;
  let D = { n: 0, sitater: [], vedlikehold: [] };  // svaret fra doGet
  let R = null;    // D.resultat, sortert og med tekster
  let nok = false;
  const komma = function (x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ','); };
  const arealNavn = {}; PG8.AREALER.forEach(function (a) { arealNavn[a.id] = a; });
  const lbl = function (liste, v) { const f = liste.find(function (x) { return String(x.v) === String(v); }); return f ? f.l : v; };

  function rute(a) {
    if (a.tilstand == null) return null;
    const mye = a.bruk >= 50, bra = a.tilstand >= 3;
    if (mye && !bra) return { navn: 'Utbedre først', cls: '' };
    if (mye && bra) return { navn: 'Ta vare på', cls: 'ok' };
    if (!mye && !bra) return { navn: 'Tilpasse bedre', cls: '' };
    return { navn: 'Gjøre bedre kjent', cls: 'ok' };
  }

  /* ---------- Seksjoner ---------- */
  function hero() {
    const andel = Math.min(100, Math.round(100 * D.n / C.husstander));
    return '<section class="o-hero">' +
      '<div><p class="etikett">Medvirkning · Runde ' + C.runde + '</p>' +
      '<h1>Vi planlegger fellesarealene sammen</h1>' +
      '<p class="ingress">Her ser du hvordan prosessen går og hva som skjer videre. Når svarfristen er ute, kommer de samlede resultatene her. Alt er anonymt – vi viser bare samlede tall.</p></div>' +
      '<div class="statuskort">' +
      '<div class="tall">' + (D.lastet && !D.feil ? D.n : '–') + ' <small>svar så langt</small></div>' +
      '<div class="svarbar" aria-hidden="true"><span style="width:' + andel + '%"></span></div>' +
      '<p>Vi håper alle ti boligene vil være med.<br>Svarfrist: <b>' + esc(PG8.svarfristTekst()) + '</b></p>' +
      (mitt ? '<span class="svart-merke">' + PG8.lite('hake').replace('<svg', '<svg style="width:1.1em;height:1.1em"') + 'Du har svart – takk!</span>' +
        '<a class="knapp" href="index.html">Endre svarene dine</a>'
        : '<a class="knapp" href="index.html">Svar på skjemaet ' + PG8.lite('pil') + '</a><span style="font-size:.85rem;opacity:.9">Tar 15–30 minutter</span>') +
      '</div></section>';
  }

  function prosess() {
    const dt = PG8.datoer();
    const steg = [
      { t: 'Kartlegging', d: dt ? dt.runde1 : 'Én uke', p: 'Hvordan brukes arealene, og hva trenger vi?' },
      { t: 'Innspill', d: dt ? dt.runde2 : 'Uken etter', p: 'Ny runde med mer konkrete spørsmål, bygget på svarene fra første runde.' },
      { t: 'Løsningsforslag', d: 'Dato kommer', p: '2–4 alternativer med pris, fordeler og ulemper.' },
      { t: 'Avstemning', d: 'Dato kommer', p: 'Hver leilighet stemmer på sitt foretrukne forslag.' },
      { t: 'Årsmøtet', d: 'Vedtak', p: 'Formelt vedtak om plan for vedlikehold og oppgradering.' }
    ];
    return '<section class="seksjon" id="prosessen"><div class="seksjon-hode"><div><p class="etikett">Prosessen</p><h2>Fra spørsmål til vedtak</h2></div>' +
      '<p>Hver runde bygger på svarene fra forrige. Slik blir forslagene laget av beboernes egne behov.</p></div>' +
      '<ol class="tidslinje">' + steg.map(function (s, i) {
        return '<li class="' + (i === 0 ? 'na' : '') + '"' + (i === 0 ? ' aria-current="step"' : '') + '>' + (i === 0 ? '<span class="her">Nå</span>' : '') +
          '<span class="nr">' + (i + 1) + '</span><b>' + s.t + '</b><span>' + s.d + '</span><p>' + s.p + '</p></li>';
      }).join('') + '</ol></section>';
  }

  function venter() {
    if (!D.lastet) return '<div class="kort venter">Henter resultater …</div>';
    if (D.feil) return '<div class="kort venter">Resultatene kunne ikke hentes akkurat nå. Prøv å laste siden på nytt om litt.</div>';
    if (D.skjultTil) return '<div class="kort venter">Resultatene vises når svarfristen er ute, ' + esc(PG8.svarfristTekst()) + '. Da kan ingen se hvordan andre har svart mens skjemaet er åpent.</div>';
    return '<div class="kort venter">Resultatene vises når minst ' + C.minVisning + ' har svart, slik at ingen kan kjennes igjen. Så langt har ' + D.n + ' svart.</div>';
  }

  function arealer() {
    let h = '<section class="seksjon" id="arealene"><div class="seksjon-hode"><div><p class="etikett">Arealene</p><h2>Slik brukes fellesarealene i dag</h2></div>' +
      '<p>Andel som bruker arealet, hvor godt det fungerer for dem, og hva som oftest er et problem.</p></div>';
    if (!nok) return h + venter() + '</section>';
    h += '<div class="arealgrid">' + R.arealer.map(function (a) {
      const def = arealNavn[a.id];
      const r = rute(a);
      const probl = a.problemer.slice(0, 3).map(function (p) { return '<span class="tag">' + esc(lbl(PG8.problemerFor(def), p.v)) + '</span>'; }).join('');
      // Bare hindringer som kan gjøres noe med, vises offentlig – ikke «har ikke behov» o.l.
      const hinder = a.hvorforIkke.filter(function (x) { return ['visste_ikke', 'adkomst', 'tilstand', 'fullt', 'tilgang'].indexOf(x.v) > -1; })[0];
      const hvorfor = hinder ? '<p style="font-size:.85rem;color:var(--ink-2)">Det som oftest hindrer bruk: <b>' + esc(lbl(PG8.hvorforIkkeFor(def), hinder.v).toLowerCase()) + '</b></p>' : '';
      return '<article class="kort arealkort">' +
        '<div class="topp-a"><span class="ai">' + PG8.ikon(def.ikon) + '</span><div><h3>' + esc(def.navn) + '</h3><span class="sted">' + esc(def.sted) + '</span></div></div>' +
        '<div class="maal">' +
        '<span class="m-lbl">Bruker det</span><span class="m-verdi">' + a.bruk + ' %</span><div class="meter" aria-hidden="true"><span style="width:' + a.bruk + '%"></span></div>' +
        (a.tilstandN ? '<span class="m-lbl">Svært viktig for dem som bruker det</span><span class="m-verdi">' + a.viktigBrukere + ' %</span>' : '') +
        '<span class="m-lbl">Fungerer</span><span class="m-verdi tilstand-vis">' + (a.tilstand != null ? PG8.fjes(a.tilstand) + komma(a.tilstand) + ' av 5' : '–') + '</span>' +
        '</div>' +
        (probl ? '<div><p style="font-size:.8rem;color:var(--muted);margin-bottom:.25rem">Vanligste problemer</p><div class="tags">' + probl + '</div></div>' : '') +
        hvorfor +
        (r ? '<div class="tags"><span class="tag ' + r.cls + '" style="font-weight:700">' + r.navn + '</span></div>' : '') +
        '</article>';
    }).join('') + '</div></section>';
    return h;
  }

  function mulighetskart() {
    let h = '<section class="seksjon" id="mulighetskart"><div class="seksjon-hode"><div><p class="etikett">Mulighetskart</p><h2>Hvor bør vi starte?</h2></div>' +
      '<p>Hvert areal er plassert etter hvor mange som bruker det, og hvor godt det fungerer. Rutene viser hva som kan være neste steg.</p></div>';
    if (!nok) return h + venter() + '</section>';
    const W = Math.max(320, Math.min(640, (document.getElementById('hoved').clientWidth || 640) - 44)), H = W < 500 ? 380 : 400, ml = 46, mr = 12, mt = 20, mb = 50;
    const x = function (v) { return ml + (W - ml - mr) * v / 100; };
    const y = function (v) { return mt + (H - mt - mb) * (5 - v) / 4; };
    const pts = R.arealer.filter(function (a) { return a.tilstand != null; });
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="kart-tittel"><title id="kart-tittel">Mulighetskart: bruk og tilstand for hvert areal. Se tabellen under for tallene.</title>';
    // ruter
    s += '<rect x="' + x(0) + '" y="' + y(3) + '" width="' + (x(50) - x(0)) + '" height="' + (y(1) - y(3)) + '" fill="#FBE6DE" opacity=".55"/>';
    s += '<rect x="' + x(50) + '" y="' + y(3) + '" width="' + (x(100) - x(50)) + '" height="' + (y(1) - y(3)) + '" fill="#FBE6DE" opacity=".9"/>';
    s += '<rect x="' + x(50) + '" y="' + y(5) + '" width="' + (x(100) - x(50)) + '" height="' + (y(3) - y(5)) + '" fill="#E4EFE8" opacity=".9"/>';
    s += '<rect x="' + x(0) + '" y="' + y(5) + '" width="' + (x(50) - x(0)) + '" height="' + (y(3) - y(5)) + '" fill="#E4EFE8" opacity=".45"/>';
    // rutenett og akser
    [1, 2, 3, 4, 5].forEach(function (v) {
      s += '<line x1="' + x(0) + '" x2="' + x(100) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#E4DFD4" stroke-width="1"/>';
      s += '<text class="akse" x="' + (ml - 10) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    [0, 25, 50, 75, 100].forEach(function (v) {
      s += '<text class="akse" x="' + x(v) + '" y="' + (H - mb + 20) + '" text-anchor="middle">' + v + ' %</text>';
    });
    s += '<text class="akse" x="' + ((ml + W - mr) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-weight="700">Andel som bruker arealet →</text>';
    s += '<text class="akse" transform="translate(14 ' + ((mt + H - mb) / 2) + ') rotate(-90)" text-anchor="middle" font-weight="700">Fungerer (1–5) →</text>';
    s += '<text class="rute-lbl" x="' + (x(0) + 8) + '" y="' + (y(5) + 18) + '">Gjøre bedre kjent</text>';
    s += '<text class="rute-lbl" x="' + (x(100) - 8) + '" y="' + (y(5) + 18) + '" text-anchor="end">Ta vare på</text>';
    s += '<text class="rute-lbl" x="' + (x(0) + 8) + '" y="' + (y(1) - 10) + '">Tilpasse bedre</text>';
    s += '<text class="rute-lbl" x="' + (x(100) - 8) + '" y="' + (y(1) - 10) + '" text-anchor="end">Utbedre først</text>';
    // punkter med enkel kollisjonshåndtering for etiketter
    // hindringer: alle punktene + etiketter som allerede er plassert
    const hinder = pts.map(function (a) { return { x0: x(a.bruk) - 9, x1: x(a.bruk) + 9, y0: y(a.tilstand) - 9, y1: y(a.tilstand) + 9 }; });
    const kolliderer = function (b) {
      return b.x0 < ml || b.x1 > W - mr || hinder.some(function (o) { return b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0; });
    };
    pts.sort(function (a, b) { return b.tilstand - a.tilstand; }).forEach(function (a) {
      const def = arealNavn[a.id];
      const px = x(a.bruk), py = y(a.tilstand);
      const tekst = def.kort, bw = tekst.length * 7.6, bh = 15;
      const kandidater = [
        { ax: 'start', lx: px + 13, ly: py + 5 }, { ax: 'end', lx: px - 13, ly: py + 5 },
        { ax: 'middle', lx: px, ly: py - 14 }, { ax: 'middle', lx: px, ly: py + 24 },
        { ax: 'start', lx: px + 10, ly: py - 12 }, { ax: 'end', lx: px - 10, ly: py + 22 }
      ].map(function (k) {
        const x0 = k.ax === 'start' ? k.lx : k.ax === 'end' ? k.lx - bw : k.lx - bw / 2;
        k.boks = { x0: x0, x1: x0 + bw, y0: k.ly - 12, y1: k.ly - 12 + bh };
        return k;
      });
      const valgt = kandidater.find(function (k) { return !kolliderer(k.boks); }) || kandidater[0];
      hinder.push(valgt.boks);
      s += '<g class="pkt" tabindex="0" data-id="' + a.id + '" aria-label="' + esc(def.navn) + ': ' + a.bruk + ' prosent bruker det, fungerer ' + komma(a.tilstand) + ' av 5">' +
        '<circle cx="' + px + '" cy="' + py + '" r="18" fill="transparent"/>' +
        '<circle class="vis" cx="' + px + '" cy="' + py + '" r="7" fill="#2F6B4F" stroke="#FFFFFF" stroke-width="2"/>' +
        '<text class="pkt-lbl" x="' + valgt.lx + '" y="' + valgt.ly + '" text-anchor="' + valgt.ax + '">' + esc(tekst) + '</text></g>';
    });
    s += '</svg>';
    h += '<div class="kort"><div class="kart-wrap">' + s + '</div>' +
      '<div class="forklaring">' +
      '<div><b>Utbedre først</b>Mange bruker det, men det fungerer dårlig.</div>' +
      '<div><b>Ta vare på</b>Mye brukt og fungerer bra.</div>' +
      '<div><b>Tilpasse bedre</b>Fungerer dårlig for dem som bruker det. Hva skal til for at rommet fungerer bedre?</div>' +
      '<div><b>Gjøre bedre kjent</b>Fungerer bra, men få bruker det.</div></div>' +
      '<details class="tabell"><summary>Vis som tabell</summary><table><thead><tr><th>Areal</th><th>Bruker det</th><th>Fungerer (1–5)</th><th>Svar</th></tr></thead><tbody>' +
      R.arealer.map(function (a) {
        return '<tr><td>' + esc(arealNavn[a.id].navn) + '</td><td class="tall">' + a.bruk + ' %</td><td class="tall">' + (a.tilstand != null ? komma(a.tilstand) : '–') + '</td><td class="tall">' + a.n + '</td></tr>';
      }).join('') + '</tbody></table></details></div></section>';
    return h;
  }

  function retning(id) {
    const r = fordelt('viktig.' + id, PG8.TOPP3_RETNING).filter(function (x) { return x.n; });
    return r.length ? '<br>' + r.map(function (x) { return esc(x.l) + ': ' + x.n; }).join('<br>') : '';
  }

  function behov() {
    let h = '<section class="seksjon" id="behov"><div class="seksjon-hode"><div><p class="etikett">Behov</p><h2>Hva trenger beboerne?</h2></div>' +
      '<p>Andel som sier at behovet er <b>svært viktig</b>. Gult merke viser hvor mange som har det blant sine tre viktigste.</p></div>';
    if (!nok) return h + venter() + '</section>';
    const maks = Math.max.apply(null, R.behov.map(function (b) { return b.svaertViktig; })) || 1;
    h += '<div class="kort"><div class="stolper bred">' + R.behov.map(function (b) {
      return '<div class="stolpe" tabindex="0" data-tip="<b>' + esc(b.l) + '</b>' + b.svaertViktig + ' % svært viktig<br>' + b.topp3 + ' har det blant sine tre viktigste<br>' + (b.neste3 || 0) + ' har det blant de tre nest viktigste<br>' + (b.valgt || 0) + ' har krysset det av som viktig' + retning(b.id) + '<br>' + b.n + ' svar">' +
        '<span class="s-lbl">' + esc(b.l) + '</span>' +
        '<span class="s-spor"><span class="s-bane"><span class="s-fyll" style="width:' + Math.max(1, 100 * b.svaertViktig / maks) + '%"></span></span>' +
        '<span class="s-verdi">' + b.svaertViktig + ' %' + (b.topp3 ? '<span class="topp3-merke">topp 3: ' + b.topp3 + '</span>' : '') + '</span></span></div>';
    }).join('') + '</div></div></section>';
    return h;
  }

  function feltNavn(felt) {
    if (felt === 'ide') return 'Idé til bedre bruk';
    if (felt === 'fritt') return 'Annet innspill';
    if (/^ute\./.test(felt || '')) return 'Utearealene';
    if (/^sykkel\./.test(felt || '')) return 'Sykler';
    if (/^endring\./.test(felt || '')) return 'Endring';
    const m = /^areal\.([^.]+)\./.exec(felt || '');
    return m && arealNavn[m[1]] ? arealNavn[m[1]].navn : 'Innspill';
  }

  /* Fordeling for ett spørsmål, sortert, med tekster fra skjemaet */
  function fordelt(key, valg) {
    const f = (R.fordeling || {})[key] || {};
    return valg.map(function (v) { return { v: v.v, l: v.l, n: f[v.v] || 0 }; }).sort(function (a, b) { return b.n - a.n; });
  }

  function stolper(liste, total) {
    const maks = Math.max.apply(null, liste.map(function (x) { return x.n; })) || 1;
    return '<div class="stolper">' + liste.map(function (x) {
      return '<div class="stolpe" tabindex="0" data-tip="<b>' + esc(x.l) + '</b>' + x.n + ' av ' + total + '"><span class="s-lbl">' + esc(x.l) + '</span>' +
        '<span class="s-spor"><span class="s-bane"><span class="s-fyll" style="width:' + Math.max(1, 100 * x.n / maks) + '%"></span></span><span class="s-verdi">' + Math.round(100 * x.n / (total || 1)) + ' %</span></span></div>';
    }).join('') + '</div>';
  }

  function skapPlass() {
    const f = fordelt('sykkel.skap.utstyr', PG8.SYKKEL_SKAP[0].under);
    const tot = f.reduce(function (a, x) { return a + x.n; }, 0);
    if (!tot) return '';
    const naer = f.find(function (x) { return x.v === 'naer'; }).n;
    return '<p style="font-size:.85rem;color:var(--ink-2);margin-top:.8rem">Av dem som har svart på hvor skapet bør stå, mener ' + naer + ' av ' + tot + ' at det bør stå rett ved sykkelparkeringen.</p>';
  }

  function sykkel() {
    let h = '<section class="seksjon" id="sykkel"><div class="seksjon-hode"><div><p class="etikett">Sykler</p><h2>Hvor mange sykler, og hva trengs?</h2></div>' +
      '<p>Grunnlag for å planlegge sykkelparkering med riktig antall plasser og riktig type.</p></div>';
    if (!nok) return h + venter() + '</section>';
    const antall = (R.fordeling || {})['sykkel.antall'] || {};
    const medSykkel = Object.keys(antall).filter(function (k) { return +k > 0; }).reduce(function (a, k) { return a + antall[k]; }, 0);
    const minst = Object.keys(antall).reduce(function (a, k) { return a + (+k) * antall[k]; }, 0);
    const kort = function (tittel, key, valg, etter) {
      return '<div class="kort"><h3>' + tittel + '</h3><p style="font-size:.85rem;color:var(--muted);margin:.2rem 0 .9rem">Andel av dem som har sykkel.</p>' + stolper(fordelt(key, valg), medSykkel) + (etter || '') + '</div>';
    };
    h += '<div class="kort" style="margin-bottom:.8rem"><p style="font-size:1.05rem">Minst <b style="font-family:var(--serif);font-size:2rem">' + minst + '</b> sykler, ifølge ' + medSykkel + ' svar fra husstander som har sykkel. ' +
      '<span style="color:var(--muted);font-size:.88rem">Svar fra flere i samme husstand kan telle samme sykler.</span></p></div>' +
      '<div class="to-kol">' + kort('Typer sykler', 'sykkel.typer', PG8.SYKKEL_TYPER) + kort('Behov for trygg låsing', 'sykkel.las', PG8.SYKKEL_LAS) +
      kort('Tørt skap og lading', 'sykkel.skap', PG8.SYKKEL_SKAP.filter(function (x) { return !x.eksklusiv; }), skapPlass()) + kort('Hvor syklene står i dag', 'sykkel.i_dag', PG8.SYKKEL_I_DAG) + '</div></section>';
    return h;
  }

  function ute() {
    let h = '<section class="seksjon" id="ute"><div class="seksjon-hode"><div><p class="etikett">Utearealene</p><h2>Ønsker for hagen og gården</h2></div>' +
      '<p>Andel som ønsker hvert tilbud i utearealene.</p></div>';
    if (!nok) return h + venter() + '</section>';
    const U = R.ute || { frekvens: {}, onsker: {}, n: 0 };
    const liste = PG8.UTE_ONSKER.filter(function (o) { return !o.eksklusiv && o.v !== 'annet'; })
      .map(function (o) { return { v: o.v, l: o.l, n: U.onsker[o.v] || 0 }; })
      .sort(function (a, b) { return b.n - a.n; });
    const maks = liste[0] && liste[0].n ? liste[0].n : 1;
    const ukentlig = (U.frekvens[3] || 0) + (U.frekvens[4] || 0);
    const fornoyd = U.onsker.fornoyd || 0;
    h += '<div class="kort"><div class="stolper">' + liste.map(function (x) {
      const p = Math.round(100 * x.n / D.n);
      const o = PG8.UTE_ONSKER.find(function (y) { return y.v === x.v; });
      const sub = fordelt('ute.onsker.' + x.v, o.under || []).filter(function (u) { return u.n; }).slice(0, 2);
      return '<div class="stolpe" tabindex="0" data-tip="<b>' + esc(x.l) + '</b>' + x.n + ' av ' + D.n + ' svar"><span class="s-lbl">' + esc(x.l) +
        (sub.length ? '<small class="s-under">Mest ønsket: ' + esc(sub.map(function (u) { return u.l.toLowerCase(); }).join(', ')) + '</small>' : '') + '</span>' +
        '<span class="s-spor"><span class="s-bane"><span class="s-fyll" style="width:' + Math.max(1, 100 * x.n / maks) + '%"></span></span><span class="s-verdi">' + p + ' %</span></span></div>';
    }).join('') + '</div>' +
      '<p style="font-size:.88rem;color:var(--ink-2);margin-top:1rem">' + Math.round(100 * ukentlig / D.n) + ' % bruker utearealene hver uke eller oftere i sommerhalvåret.' +
      (fornoyd ? ' ' + fornoyd + ' er fornøyd slik det er.' : '') + '</p></div></section>';
    return h;
  }

  function sitater() {
    if (!D.sitater || !D.sitater.length) return '';
    return '<section class="seksjon" id="sitater"><div class="seksjon-hode"><div><p class="etikett">Dette sier beboerne</p><h2>Innspill med egne ord</h2></div>' +
      '<p>Et utvalg fritekstsvar. Styret leser alle, og publiserer bare innspill som ikke kan knyttes til enkeltpersoner.</p></div>' +
      '<div class="sitater">' + D.sitater.map(function (s) {
        return '<blockquote class="kort sitat" style="margin:0"><p>' + esc(s.tekst) + '</p><footer>' + esc(feltNavn(s.felt)) + '</footer></blockquote>';
      }).join('') + '</div></section>';
  }

  function holdninger() {
    let h = '<section class="seksjon" id="holdninger"><div class="seksjon-hode"><div><p class="etikett">Holdninger</p><h2>Hvor store endringer ønsker vi?</h2></div>' +
      '<p>Dette avgjør hvor ambisiøse løsningsforslagene bør være.</p></div>';
    if (!nok) return h + venter() + '</section>';
    const farger = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)'];
    const totE = PG8.ENDRING.reduce(function (a, e) { return a + (R.endring[e.v] || 0); }, 0) || 1;
    const endring = '<div class="kort"><h3>Åpenhet for endring</h3>' +
      '<div class="stabel" role="img" aria-label="Fordeling av svar, se forklaringen under">' + PG8.ENDRING.map(function (e, i) {
        const p = 100 * (R.endring[e.v] || 0) / totE;
        return p ? '<span style="width:' + p + '%;background:' + farger[i] + '" data-tip="<b>' + esc(e.l) + '</b>' + Math.round(p) + ' % (' + (R.endring[e.v] || 0) + ' svar)"></span>' : '';
      }).join('') + '</div>' +
      '<ul class="legende">' + PG8.ENDRING.map(function (e, i) {
        return '<li><i style="background:' + farger[i] + '"></i>' + esc(e.l) + '<b>' + Math.round(100 * (R.endring[e.v] || 0) / totE) + ' %</b></li>';
      }).join('') + '</ul></div>';
    const totK = PG8.KOSTNAD.reduce(function (a, k) { return a + (R.kostnad[k.v] || 0); }, 0) || 1;
    const maksK = Math.max.apply(null, PG8.KOSTNAD.map(function (k) { return R.kostnad[k.v] || 0; })) || 1;
    const kostnad = '<div class="kort"><h3>Villig til å betale mer i felleskostnader</h3><p style="font-size:.85rem;color:var(--muted);margin:.2rem 0 .9rem">Per husstand per måned. Ikke bindende.</p>' +
      '<div class="stolper">' + PG8.KOSTNAD.map(function (k) {
        const v = R.kostnad[k.v] || 0;
        return '<div class="stolpe" tabindex="0" data-tip="<b>' + esc(k.l) + '</b>' + v + ' svar (' + Math.round(100 * v / totK) + ' %)"><span class="s-lbl">' + esc(k.l) + '</span>' +
          '<span class="s-spor"><span class="s-bane"><span class="s-fyll" style="width:' + Math.max(1, 100 * v / maksK) + '%;' + (k.v === 'vet_ikke' ? 'background:var(--line-strong)' : '') + '"></span></span><span class="s-verdi">' + Math.round(100 * v / totK) + ' %</span></span></div>';
      }).join('') + '</div></div>';
    return h + '<div class="to-kol">' + endring + kostnad + '</div></section>';
  }

  function vedlikehold() {
    let h = '<section class="seksjon" id="vedlikehold"><div class="seksjon-hode"><div><p class="etikett">Vedlikehold</p><h2>Det bygningen trenger uansett</h2></div>' +
      '<p>Styret lager en samlet plan for vedlikehold og oppgradering til årsmøtet. Her er det vi vet om, og det beboerne mener er viktigst.</p></div>';
    const styret = '<div class="kort"><h3>Kjent for styret</h3>' + (D.vedlikehold && D.vedlikehold.length
      ? '<ul class="liste" style="margin-top:.5rem">' + D.vedlikehold.map(function (v) {
        return '<li>' + esc(v.l) + '<span class="status ' + (v.status === 'Må utbedres' ? 'kjent' : 'vurderes') + '">' + esc(v.status) + '</span></li>';
      }).join('') + '</ul>'
      : '<p style="color:var(--ink-2);margin-top:.5rem">Styret legger ut listen over kjente vedlikeholdsbehov her.</p>') + '</div>';
    let beboere = '';
    if (nok) {
      const liste = Object.keys(R.vedlikehold).map(function (k) { return { v: k, n: R.vedlikehold[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
      const maks = liste[0] ? liste[0].n : 1;
      beboere = '<div class="kort"><h3>Beboerne prioriterer</h3><p style="font-size:.85rem;color:var(--muted);margin:.2rem 0 .9rem">Andel som har krysset av for hvert tiltak.</p><div class="stolper">' + liste.map(function (x) {
        const p = Math.round(100 * x.n / D.n);
        return '<div class="stolpe" tabindex="0" data-tip="<b>' + esc(lbl(PG8.VEDLIKEHOLD, x.v)) + '</b>' + x.n + ' av ' + D.n + ' svar"><span class="s-lbl">' + esc(lbl(PG8.VEDLIKEHOLD, x.v)) + '</span>' +
          '<span class="s-spor"><span class="s-bane"><span class="s-fyll" style="width:' + (100 * x.n / maks) + '%"></span></span><span class="s-verdi">' + p + ' %</span></span></div>';
      }).join('') + (liste.length ? '' : '<p style="color:var(--ink-2)">Ingen har krysset av for vedlikehold ennå.</p>') + '</div></div>';
    } else beboere = venter();
    return h + '<div class="to-kol">' + styret + beboere + '</div></section>';
  }

  function faq() {
    const q = [
      ['Er svarene anonyme?', 'Ja. Skjemaet spør ikke om navn eller leilighetsnummer. Vil du delta videre, kan du oppgi kontaktinfo – den lagres for seg og kobles ikke til svarene dine. Her på siden vises bare samlede tall, og først når svarfristen er ute. Før det kan ingen se hvordan andre har svart.'],
      ['Hvem kan se svarene?', 'Styret har tilgang til alle enkeltsvar, for å kunne lage neste runde. Alle beboere kan se de samlede resultatene her. Svarene slettes når prosessen er ferdig etter årsmøtet.'],
      ['Jeg vil heller svare på papir, eller trenger hjelp', 'Det går helt fint. Kontakt ' + esc(C.hjelp) + ', så får du et papirskjema eller hjelp til å fylle ut.'],
      ['Må jeg svare?', 'Nei, det er frivillig. Dette er en invitasjon til å være med og bestemme i fellesskap. Jo flere som svarer, jo bedre grunnlag får vi.'],
      ['Må alle i husstanden svare?', 'Nei, det holder med ett svar fra hver bolig. Vil flere i boligen svare hver for seg, går det også fint. Ved avstemningen får hver leilighet én stemme.'],
      ['Hva skjer etter at jeg har svart?', 'Styret går gjennom svarene når fristen er ute. Uken etter kommer en ny runde med mer konkrete spørsmål. Deretter lager vi 2–4 løsningsforslag som alle kan stemme over før årsmøtet, der det formelle vedtaket gjøres.'],
      ['Blir felleskostnadene høyere?', 'Det er ikke bestemt. Vedlikehold må gjøres uansett. Spørsmålet om betalingsvilje hjelper oss å lage forslag i ulike prisklasser, og alt avgjøres på årsmøtet.']
    ];
    return '<section class="seksjon" id="sporsmal"><div class="seksjon-hode"><div><p class="etikett">Spørsmål og svar</p><h2>Lurer du på noe?</h2></div></div>' +
      q.map(function (x) { return '<details class="faq"><summary>' + x[0] + '</summary><div>' + x[1] + '</div></details>'; }).join('') +
      '<footer class="bunn">Styret i Sameiet Pavels gate 8' + (C.kontakt ? ' · <a href="mailto:' + esc(C.kontakt) + '">' + esc(C.kontakt) + '</a>' : '') + '</footer></section>';
  }

  /* ---------- Data ---------- */
  function hentData() {
    if (C.endpoint) {
      return fetch(C.endpoint + '?runde=' + encodeURIComponent(C.runde), { redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.feil); return j; });
    }
    // Uten tilkobling: ingen svar vises. (Eksempeldata lastes bare i lokal test, se apps-script/test/lokal-server.js)
    // Som i Apps Script: ingen resultater før fristen er ute. ?forhandsvis viser dem likevel.
    const alle = (PG8.DEMO_SVAR || []).slice();
    const skjult = PG8.innenFrist() && !/forhandsvis/.test(location.search);
    return Promise.resolve({
      ok: true, n: alle.length,
      resultat: !skjult && alle.length >= C.minVisning ? aggreger(alle) : null,
      skjultTil: skjult ? C.svarfrist : null,
      sitater: skjult ? [] : (PG8.DEMO_SITATER || []), vedlikehold: PG8.DEMO_VEDLIKEHOLD || []
    });
  }

  /* Ordner resultatet etter skjemaets rekkefølge og legger på tekster */
  function klargjor(res) {
    if (!res) return null;
    const perId = {};
    res.arealer.forEach(function (a) { perId[a.id] = a; });
    res.arealer = PG8.AREALER.map(function (a) {
      return perId[a.id] || { id: a.id, n: 0, bruk: 0, jevnlig: 0, tilstand: null, tilstandN: 0, viktig: 0, problemer: [], hvorforIkke: [] };
    });
    const behovTekst = {};
    PG8.BEHOV.forEach(function (b) { behovTekst[b.id] = b.l; });
    res.behov = res.behov.filter(function (b) { return behovTekst[b.id]; }).map(function (b) { b.l = behovTekst[b.id]; return b; });
    return res;
  }

  function tegnSide() {
    // Før svarfristen (og mens data lastes) vises bare overskriften og prosessen
    const kunProsess = !D.lastet || D.skjultTil;
    document.getElementById('hoved').innerHTML = kunProsess
      ? hero() + prosess() + (D.lastet ? '<section class="seksjon"><div class="kort venter">Når svarfristen er ute, ' + esc(PG8.svarfristTekst()) +
          ', kommer oversikten over hvordan vi bruker fellesarealene og hva beboerne har svart, her.</div></section>' : '') +
          '<footer class="bunn">Styret i Sameiet Pavels gate 8' + (C.kontakt ? ' · <a href="mailto:' + esc(C.kontakt) + '">' + esc(C.kontakt) + '</a>' : '') + '</footer>'
      : hero() + prosess() + arealer() + mulighetskart() + behov() + ute() + sykkel() + sitater() + holdninger() + vedlikehold() + faq();
    // Menyen viser bare lenker til seksjoner som finnes
    document.querySelectorAll('.toppnav a').forEach(function (a) { a.hidden = !document.querySelector(a.getAttribute('href')); });
  }

  document.getElementById('demo-band').hidden = !!C.endpoint;
  if (!C.endpoint) document.getElementById('demo-band').innerHTML = 'Skjemaet er ikke åpnet ennå. Svar som sendes inn nå, blir ikke lagret.';
  tegnSide();
  hentData()
    .then(function (d) {
      D = d; D.lastet = true;
      R = klargjor(d.resultat);
      nok = !!R;
    })
    .catch(function () { D = { n: 0, sitater: [], vedlikehold: [], lastet: true, feil: true }; })
    .then(tegnSide);

  /* ---------- Verktøytips ---------- */
  const tip = document.getElementById('tooltip');
  function visTip(el, html) {
    tip.innerHTML = html;
    tip.classList.add('vis');
    const r = el.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let left = r.left + r.width / 2 - tr.width / 2 + window.scrollX;
    left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - tr.width - 8));
    tip.style.left = left + 'px';
    tip.style.top = (r.top + window.scrollY - tr.height - 10) + 'px';
  }
  function skjulTip() { tip.classList.remove('vis'); }
  function tipFor(el) {
    if (el.dataset.tip) return el.dataset.tip;
    if (el.classList.contains('pkt')) {
      const a = R.arealer.find(function (x) { return x.id === el.dataset.id; });
      return '<b>' + esc(arealNavn[a.id].navn) + '</b>' + a.bruk + ' % bruker det (' + a.jevnlig + ' % månedlig eller oftere)<br>Fungerer: ' + komma(a.tilstand) + ' av 5 (' + a.tilstandN + ' svar)<br>' + a.viktig + ' % sier det er svært viktig';
    }
    return null;
  }
  ['mouseover', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      const el = e.target.closest && e.target.closest('[data-tip], .pkt');
      if (!el) return;
      const target = el.classList.contains('pkt') ? el.querySelector('circle.vis') : el;
      visTip(target, tipFor(el));
    });
  });
  ['mouseout', 'focusout'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      const el = e.target.closest && e.target.closest('[data-tip], .pkt');
      if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) skjulTip();
    });
  });
})();
