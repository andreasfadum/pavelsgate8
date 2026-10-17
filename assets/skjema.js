/* Skjemamotor: tegner stegene fra PG8.byggSteg() og holder styr på svarene. */
(function () {
  const C = PG8.CONFIG;
  const KLADD = PG8.nokkel('kladd');
  const SENDT = PG8.nokkel('sendt');
  const STEG = PG8.byggSteg();
  const ANTALL = STEG.length - 2; // uten velkommen og takk
  const esc = PG8.esc;

  const kladd = PG8.hent(KLADD) || {};
  let svar = kladd.svar || {};
  let innsendingId = kladd.id || null;
  let idx = 0;
  let tilOppsummering = false;
  let synlige = {};
  let valgFor = {};
  let visUbesvarte = false;
  let redigerer = !!kladd.redigerer;   // true når et innsendt svar endres
  let sistRedigert = false;

  /* Innsendte svar fra denne enheten (en liste – flere i husstanden kan svare på samme enhet) */
  function hentSendt() {
    const x = PG8.hent(SENDT);
    if (!x) return [];
    return Array.isArray(x) ? x : [{ id: x.data && x.data.id, tidspunkt: x.tidspunkt, data: x.data }];
  }
  function klokke(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' }) + ' kl. ' + d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  }

  const $steg = document.getElementById('steg');
  const $frem = document.getElementById('fremdrift');
  const $nav = document.getElementById('navbar');

  PG8.initTekst();
  const band = document.getElementById('demo-band');
  if (band) band.hidden = !!C.endpoint;

  function harSvar(v) {
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }
  function antallSvar() {
    return Object.keys(svar).filter(function (k) { return harSvar(svar[k]); }).length;
  }
  function lagreKladd() {
    PG8.lagre(KLADD, { svar: svar, idx: idx, id: innsendingId, redigerer: redigerer, endret: new Date().toISOString() });
    const l = document.querySelector('.lagret');
    if (l) l.innerHTML = PG8.lite('lagre') + 'Lagret';
  }
  function vises(q) { return !q.vis || q.vis(svar); }
  function valgListe(q) { return typeof q.valg === 'function' ? q.valg(svar) : q.valg; }

  /* ---------- Spørsmålstyper ---------- */
  function knapp(q, key, v, i, type, ekstra) {
    const valgt = type === 'single' ? svar[key] === v.v : (svar[key] || []).indexOf(v.v) > -1;
    const sperret = ekstra && ekstra.sperret && !valgt;
    return '<button type="button" class="opt" data-type="' + type + '" data-key="' + esc(key) + '" data-i="' + i + '" aria-pressed="' + valgt + '"' +
      (sperret ? ' aria-disabled="true"' : '') + '>' +
      '<span class="merk">' + PG8.lite('hake') + '</span>' +
      '<span>' + esc(v.l) + (v.h ? '<small>' + esc(v.h) + '</small>' : '') + '</span></button>' +
      (valgt && v.under ? underValg(key + '.' + v.v, v) : '');
  }

  /* Frivillige underalternativer som vises når et hovedvalg er krysset av */
  function underValg(key, v) {
    valgFor[key] = v.under;
    const type = v.underType || 'multi';
    return '<div class="under" role="group" aria-label="' + esc((v.underLabel || 'Utdyp gjerne') + ': ' + v.l) + '">' +
      '<p class="under-lbl">' + esc(v.underLabel || 'Utdyp gjerne (valgfritt)') + '</p><div class="under-valg">' +
      v.under.map(function (u, i) {
        const valgt = type === 'single' ? svar[key] === u.v : (svar[key] || []).indexOf(u.v) > -1;
        return '<button type="button" class="opt sub" data-type="' + type + '" data-key="' + esc(key) + '" data-i="' + i + '" aria-pressed="' + valgt + '">' +
          '<span class="merk">' + PG8.lite('hake') + '</span><span>' + esc(u.l) + '</span></button>';
      }).join('') + '</div></div>';
  }

  function hode(q, id) {
    return '<legend id="' + id + '">' + (q.merke ? '<span class="prio-merke">' + esc(q.merke) + '</span>' : '') + esc(q.label) + '</legend>' + (q.hjelp ? '<p class="hjelp">' + esc(q.hjelp) + '</p>' : '');
  }

  function tegnSporsmal(q, qi) {
    const id = 'q' + qi;
    const ny = !synlige[q.key] ? ' ny' : '';
    let h = '';
    if (q.type === 'single' || q.type === 'multi') {
      const vl = valgListe(q); valgFor[q.key] = vl;
      h = '<fieldset class="sporsmal' + ny + '">' + hode(q, id) +
        '<div class="valg' + (q.layout === 'rad' ? ' rad' : '') + '">' +
        vl.map(function (v, i) { return knapp(q, q.key, v, i, q.type); }).join('') + '</div></fieldset>';
    } else if (q.type === 'pick') {
      const vl = valgListe(q); valgFor[q.key] = vl;
      const valgt = (svar[q.key] || []).filter(function (x) { return vl.some(function (v) { return v.v === x; }); });
      const fullt = valgt.length >= q.maks;
      h = '<fieldset class="sporsmal' + (q.merke ? ' prioritet' : '') + ny + '">' + hode(q, id) +
        (q.filtrertHjelp && vl.length < PG8.BEHOV.length ? '<p class="hjelp">' + esc(q.filtrertHjelp) + '</p>' : '') +
        '<p class="hjelp" aria-live="polite">' + (fullt ? 'Du har valgt tre. Trykk på et valg for å fjerne det.' : 'Valgt: ' + valgt.length + ' av ' + q.maks) + '</p>' +
        '<div class="valg">' + vl.map(function (v, i) { return knapp(q, q.key, v, i, 'multi', { sperret: fullt }); }).join('') + '</div></fieldset>';
    } else if (q.type === 'faces') {
      valgFor[q.key] = q.valg;
      h = '<fieldset class="sporsmal' + ny + '">' + hode(q, id) + '<div class="fjes">' +
        q.valg.map(function (v, i) {
          return '<button type="button" class="opt" data-type="single" data-key="' + esc(q.key) + '" data-i="' + i + '" aria-pressed="' + (svar[q.key] === v.v) + '">' +
            PG8.fjes(v.v) + '<span>' + esc(v.l) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="vetikke"><button type="button" class="opt" data-type="single" data-key="' + esc(q.key) + '" data-i="vet" aria-pressed="' + (svar[q.key] === 'vet_ikke') + '">Vet ikke</button></div></fieldset>';
    } else if (q.type === 'matrise') {
      h = '<div class="sporsmal' + ny + '"><div class="matrise">' + q.rader.map(function (r, ri) {
        const key = q.key + '.' + r.id; valgFor[key] = q.valg;
        return '<div class="mrad" role="group" aria-labelledby="' + id + 'r' + ri + '"><div class="mrad-lbl" id="' + id + 'r' + ri + '">' + esc(r.l) + '</div>' +
          '<div class="seg">' + q.valg.map(function (v, i) { return knapp(q, key, v, i, 'single'); }).join('') + '</div></div>';
      }).join('') + '</div></div>';
    } else if (q.type === 'text') {
      h = '<div class="sporsmal' + ny + '"><label class="lbl" for="' + id + '">' + esc(q.label) + '</label>' +
        (q.hjelp ? '<p class="hjelp" id="' + id + 'h">' + esc(q.hjelp) + '</p>' : '') +
        '<textarea id="' + id + '" data-tekst="' + esc(q.key) + '"' + (q.stor ? ' class="stor"' : '') + (q.hjelp ? ' aria-describedby="' + id + 'h"' : '') + '>' + esc(svar[q.key] || '') + '</textarea></div>';
    } else if (q.type === 'kontakt') {
      const f = function (k, l, t, ac) {
        return '<div class="felt"><label for="' + id + k + '">' + l + '</label><input id="' + id + k + '" type="' + t + '" autocomplete="' + ac + '" data-tekst="kontakt.' + k + '" value="' + esc(svar['kontakt.' + k] || '') + '"></div>';
      };
      h = '<fieldset class="sporsmal' + ny + '">' + hode(q, id) + '<div style="clear:both">' +
        f('navn', 'Navn', 'text', 'name') + f('tlf', 'Telefon eller e-post', 'text', 'email') + f('leil', 'Leilighet (valgfritt)', 'text', 'off') + '</div></fieldset>';
    }
    return h;
  }

  /* ---------- Steg ---------- */
  function tegnVelkommen() {
    const sendt = hentSendt();
    const paabegynt = antallSvar() > 0;
    const aapent = PG8.innenFrist();
    let knapper;
    if (!aapent) {
      knapper = '<p class="hjelpeboks" style="margin:0">Svarfristen var ' + esc(PG8.svarfristTekst()) + ', og skjemaet er stengt. Takk til alle som svarte!</p>';
    } else if (paabegynt) {
      knapper = '<button type="button" class="knapp" data-gaa="fortsett">Fortsett der du slapp ' + PG8.lite('pil') + '</button>' +
        '<button type="button" class="knapp stille" data-gaa="nytt">Start på nytt</button>';
    } else {
      knapper = '<button type="button" class="knapp" data-gaa="start">Start ' + PG8.lite('pil') + '</button>';
    }
    return '<div class="hero-kort"><div class="dekor"></div><div class="dekor2"></div>' +
      (sendt.length ? '<div class="hjelpeboks sendt-boks" style="margin:0 0 1.2rem"><p>' + PG8.lite('hake').replace('<svg', '<svg style="width:1.1em;height:1.1em;vertical-align:-.15em;color:var(--primary)"') +
        ' Du har sendt inn svar fra denne enheten – takk! Andre i husstanden kan gjerne svare også.</p>' +
        (aapent ? '<p style="margin-top:.5rem">Du kan endre svarene dine fram til ' + esc(PG8.svarfristTekst()) + '.</p><div class="handlinger" style="margin-top:.6rem">' +
          sendt.map(function (e, i) {
            return '<button type="button" class="knapp sekundar" data-endre-sendt="' + i + '">Endre svarene' + (sendt.length > 1 ? ' sendt ' + esc(klokke(e.tidspunkt)) : '') + '</button>';
          }).join('') + '</div>' : '') + '</div>' : '') +
      '<p class="overtittel">Fra styret · Runde 1</p>' +
      '<h1 tabindex="-1" style="margin-top:.4rem">Hvordan vil vi bruke fellesarealene?</h1>' +
      '<p class="ingress">Vi vil vite hvordan du bruker kjelleren, loftet og utearealene i dag, og hva du trenger. Målet er å tilpasse rommene bedre til det vi bruker dem til. Svarene dine blir grunnlaget for konkrete forslag som alle får stemme over før årsmøtet.</p>' +
      '<ul class="fakta">' +
      '<li><span class="fi">' + PG8.lite('klokke') + '</span><span><b>Ca. 15 minutter</b><span>Ett tema om gangen. Du kan gå tilbake når som helst.</span></span></li>' +
      '<li><span class="fi">' + PG8.lite('lås') + '</span><span><b>Anonymt</b><span>Vi spør ikke om navn. Bare ett spørsmål må besvares: hva som er viktigst for deg.</span></span></li>' +
      '<li><span class="fi">' + PG8.lite('pause') + '</span><span><b>Lagres underveis</b><span>Lukker du siden, kan du fortsette senere på samme enhet. Etter at du har sendt inn, kan du endre svarene fram til fristen.</span></span></li>' +
      '</ul>' +
      '<p style="font-weight:700">Vi spør om disse arealene:</p><div class="areal-rad">' +
      PG8.AREALER.map(function (a) { return '<span class="areal-chip">' + PG8.ikon(a.ikon) + esc(a.kort) + '</span>'; }).join('') + '</div>' +
      '<div class="handlinger">' + knapper + '</div>' +
      '<p class="hjelpeboks">Trenger du hjelp, eller vil du heller svare på papir? Kontakt ' + esc(C.hjelp) + '.<br>Svarfrist: <b>' + esc(PG8.svarfristTekst()) + '</b>.</p>' +
      '</div>' +
      '<p style="text-align:center;margin-top:1.4rem"><a href="oversikt.html">Se felles oversikt over prosessen</a></p>';
  }

  function formater(q, verdi) {
    if (!harSvar(verdi)) return null;
    if (q.type === 'text') return esc(verdi);
    const vl = valgListe(q) || [];
    const navn = function (v) { const f = vl.find(function (x) { return x.v === v; }); return f ? f.l : v; };
    if (q.type === 'faces' && verdi === 'vet_ikke') return 'Vet ikke';
    if (Array.isArray(verdi)) {
      return esc(verdi.map(function (v) {
        const f = vl.find(function (x) { return x.v === v; });
        const sub = svar[q.key + '.' + v];
        if (!f || !f.under || !harSvar(sub)) return navn(v);
        const subNavn = [].concat(sub).map(function (u) { const g = f.under.find(function (x) { return x.v === u; }); return g ? g.l.toLowerCase() : u; });
        return f.l + ' (' + subNavn.join(', ') + ')';
      }).join(', '));
    }
    return esc(navn(verdi));
  }

  /* Spørsmål som vises, men ikke er besvart. Fritekst, kontaktinfo og valgfrie spørsmål regnes ikke med. */
  function ubesvarte() {
    const ut = [];
    STEG.forEach(function (st, si) {
      if (!st.sporsmal) return;
      const mangler = [];
      st.sporsmal.forEach(function (q) {
        if (!vises(q) || q.valgfri || q.type === 'text' || q.type === 'kontakt') return;
        if (q.type === 'matrise') {
          const tomme = q.rader.filter(function (r) { return !harSvar(svar[q.key + '.' + r.id]); }).length;
          if (tomme) mangler.push(tomme + ' av ' + q.rader.length + ' behov er ikke vurdert');
        } else if (!harSvar(svar[q.key])) mangler.push(q.label);
      });
      if (mangler.length) ut.push({ si: si, tittel: st.tittel, mangler: mangler });
    });
    return ut;
  }

  function ubesvartBoks() {
    const u = ubesvarte();
    if (!u.length) return '';
    const n = u.reduce(function (a, x) { return a + x.mangler.length; }, 0);
    return '<div class="ubesvart-boks" id="ubesvart" tabindex="-1">' +
      '<p><b>Du har ikke svart på ' + n + (n === 1 ? ' spørsmål' : ' spørsmål') + '.</b> Det er helt greit å la noe stå tomt, men kanskje du har oversett noe?</p>' +
      '<div class="handlinger" style="margin-top:.7rem">' +
      '<button type="button" class="knapp sekundar" data-gaa="vis-ubesvarte" aria-expanded="' + visUbesvarte + '">' + (visUbesvarte ? 'Skjul listen' : 'Vis meg spørsmålene jeg ikke har svart på') + '</button>' +
      '<button type="button" class="knapp" data-gaa="send-likevel">Send inn svarene mine ' + PG8.lite('hake') + '</button></div>' +
      (visUbesvarte ? '<ul class="ubesvart-liste">' + u.map(function (x) {
        return '<li><div><b>' + esc(x.tittel) + '</b>' + x.mangler.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' +
          '<button type="button" class="knapp sekundar endre" data-endre="' + x.si + '">Svar nå</button></li>';
      }).join('') + '</ul>' : '') + '</div>';
  }

  function tegnOppsummering() {
    let h = '<h1 tabindex="-1">Se over svarene dine</h1><p class="ingress">Trykk «Endre» for å rette noe. Når du er fornøyd, trykker du «Send inn». ' +
      'Du kan endre svarene dine fram til ' + esc(PG8.svarfristTekst()) + '.</p>' + ubesvartBoks();
    STEG.forEach(function (s, si) {
      if (!s.sporsmal) return;
      let rader = '';
      s.sporsmal.forEach(function (q) {
        if (!vises(q)) return;
        if (q.type === 'matrise') {
          [3, 2, 1].forEach(function (niva) {
            const rad = q.rader.filter(function (r) { return svar[q.key + '.' + r.id] === niva; }).map(function (r) { return r.l; });
            if (rad.length) rader += '<dt>' + esc(PG8.BEHOV_SKALA[niva - 1].l) + '</dt><dd>' + esc(rad.join(', ')) + '</dd>';
          });
        } else if (q.type === 'kontakt') {
          const k = ['navn', 'tlf', 'leil'].map(function (x) { return svar['kontakt.' + x]; }).filter(Boolean);
          if (k.length) rader += '<dt>' + esc(q.label) + '</dt><dd>' + esc(k.join(' · ')) + '</dd>';
        } else {
          const f = formater(q, svar[q.key]);
          if (f) rader += '<dt>' + esc(q.label) + '</dt><dd>' + f + '</dd>';
        }
      });
      h += '<section class="oppsum-gruppe"><header><h3>' + esc(s.tittel) + '</h3>' +
        '<button type="button" class="knapp sekundar endre" data-endre="' + si + '" aria-label="Endre ' + esc(s.tittel) + '">Endre</button></header>' +
        (rader ? '<dl>' + rader + '</dl>' : '<p class="tom">Ikke besvart</p>') + '</section>';
    });
    return h;
  }

  function tegnTakk() {
    return '<div class="hero-kort" style="text-align:center"><div class="dekor"></div>' +
      '<div class="steg-ikon" style="margin:0 auto 1rem;width:5rem;height:5rem;border-radius:50%;background:var(--primary);color:#fff">' + PG8.lite('hake') + '</div>' +
      '<h1 tabindex="-1" style="margin:0 auto;max-width:none">' + (sistRedigert ? 'Endringene er lagret!' : 'Takk for at du svarte!') + '</h1>' +
      '<p class="ingress" style="margin:.8rem auto 0">Styret går gjennom alle svarene når fristen er ute (' + esc(PG8.svarfristTekst()) + '). Uken etter kommer en ny runde med mer konkrete spørsmål – og til slutt forslag som alle kan stemme over.</p>' +
      '<p style="margin:.8rem auto 0;max-width:40ch">Du kan endre svarene dine fram til ' + esc(PG8.svarfristTekst()) + '. Åpne skjemaet igjen på denne enheten og trykk «Endre svarene».</p>' +
      '<div class="handlinger" style="justify-content:center"><a class="knapp" href="oversikt.html">Se felles oversikt ' + PG8.lite('pil') + '</a></div>' +
      '<p style="margin-top:1.4rem;font-size:.9rem;color:var(--muted)">Vil en annen i husstanden svare? <button type="button" class="knapp stille" data-gaa="nytt" style="min-height:auto;padding:0">Start et nytt skjema</button></p>' +
      '</div>';
  }

  function tegnSteg(s) {
    valgFor = {};
    let h = '';
    if (s.areal) {
      h += '<div class="steg-hode"><span class="steg-ikon">' + PG8.ikon(s.areal.ikon) + '</span><div>' +
        '<p class="overtittel">' + esc(s.overtittel) + '<span class="sted-merke">' + esc(s.areal.sted) + '</span></p>' +
        '<h1 tabindex="-1">' + esc(s.tittel) + '</h1></div></div>';
    } else {
      h += '<h1 tabindex="-1">' + esc(s.tittel) + '</h1>';
    }
    if (s.ingress) h += '<p class="ingress">' + esc(s.ingress) + '</p>';
    const nyeSynlige = {};
    s.sporsmal.forEach(function (q, qi) {
      if (!vises(q)) return;
      h += tegnSporsmal(q, qi);
      nyeSynlige[q.key] = true;
    });
    synlige = nyeSynlige;
    return h;
  }

  function tegnNav(s) {
    if (s.type === 'velkommen' || s.type === 'takk') { $nav.innerHTML = ''; $nav.hidden = true; return; }
    $nav.hidden = false;
    const neste = s.type === 'oppsummering'
      ? '<button type="button" class="knapp neste" data-gaa="send">Send inn ' + PG8.lite('hake') + '</button>'
      : '<button type="button" class="knapp neste" data-gaa="neste">' + (tilOppsummering ? 'Tilbake til oversikten' : 'Neste') + ' ' + PG8.lite('pil') + '</button>';
    $nav.innerHTML = '<div class="navbar-inner">' +
      '<button type="button" class="knapp sekundar" data-gaa="tilbake">' + PG8.lite('tilbake') + '<span>Tilbake</span></button>' +
      '<span class="lagret">' + (antallSvar() ? PG8.lite('lagre') + 'Lagret' : '') + '</span>' + neste + '</div>';
  }

  function tegnFremdrift(s) {
    if (s.type === 'velkommen' || s.type === 'takk') { $frem.innerHTML = ''; return; }
    const pros = Math.round(100 * idx / ANTALL);
    $frem.innerHTML = '<div class="fremdrift"><div class="fremdrift-tekst"><span>Steg ' + idx + ' av ' + ANTALL + '</span><span>' + pros + ' % ferdig</span></div>' +
      '<div class="fremdrift-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pros + '" aria-label="Fremdrift"><span style="width:' + pros + '%"></span></div></div>';
  }

  function tegn(flytt) {
    const s = STEG[idx];
    if (flytt) synlige = {};
    let h;
    if (s.type === 'velkommen') h = tegnVelkommen();
    else if (s.type === 'oppsummering') h = tegnOppsummering();
    else if (s.type === 'takk') h = tegnTakk();
    else h = tegnSteg(s);
    $steg.innerHTML = h;
    tegnFremdrift(s);
    tegnNav(s);
    if (flytt) {
      window.scrollTo(0, 0);
      const h1 = $steg.querySelector('h1');
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  function gaaTil(ny) {
    idx = Math.max(0, Math.min(STEG.length - 1, ny));
    if (STEG[idx].type !== 'takk') lagreKladd();
    tegn(true);
  }

  /* ---------- Hendelser ---------- */
  document.addEventListener('click', function (e) {
    const opt = e.target.closest('button.opt');
    if (opt) {
      if (opt.getAttribute('aria-disabled') === 'true') return;
      const key = opt.dataset.key;
      const i = opt.dataset.i;
      const v = i === 'vet' ? 'vet_ikke' : valgFor[key][+i].v;
      const valg = i === 'vet' ? null : valgFor[key][+i];
      if (opt.dataset.type === 'single') {
        if (svar[key] === v) delete svar[key]; else svar[key] = v;
      } else {
        let liste = (svar[key] || []).slice();
        const pos = liste.indexOf(v);
        if (pos > -1) { liste.splice(pos, 1); delete svar[key + '.' + v]; }
        else if (valg && valg.eksklusiv) { liste.forEach(function (x) { delete svar[key + '.' + x]; }); liste = [v]; }
        else {
          liste = liste.filter(function (x) { return !(valgFor[key].find(function (y) { return y.v === x && y.eksklusiv; })); });
          liste.push(v);
        }
        svar[key] = liste;
      }
      if (PG8.rydd) PG8.rydd(svar);
      lagreKladd();
      const y = window.scrollY;
      tegn(false);
      window.scrollTo(0, y);
      const igjen = $steg.querySelector('button.opt[data-key="' + CSS.escape(key) + '"][data-i="' + i + '"]');
      if (igjen) igjen.focus({ preventScroll: true });
      return;
    }
    const endreSendt = e.target.closest('[data-endre-sendt]');
    if (endreSendt) {
      if (antallSvar() && !confirm('Du har et påbegynt skjema. Vil du forkaste det og endre svarene du sendte inn?')) return;
      const post = hentSendt()[+endreSendt.dataset.endreSendt];
      svar = {};
      Object.keys(post.data || {}).forEach(function (k) { if (['id', 'runde', 'versjon', 'hp'].indexOf(k) === -1) svar[k] = post.data[k]; });
      Object.keys(post.kontakt || {}).forEach(function (k) { if (k !== 'runde' && k !== 'videre') svar['kontakt.' + k] = post.kontakt[k]; });
      innsendingId = post.id; redigerer = true; tilOppsummering = false;
      gaaTil(STEG.length - 2);
      return;
    }
    const endre = e.target.closest('[data-endre]');
    if (endre) { tilOppsummering = true; gaaTil(+endre.dataset.endre); return; }

    const g = e.target.closest('[data-gaa]');
    if (!g) return;
    const hva = g.dataset.gaa;
    if (hva === 'start') gaaTil(1);
    else if (hva === 'fortsett') gaaTil(Math.min(kladd.idx || 1, STEG.length - 2) || 1);
    else if (hva === 'nytt') {
      if (antallSvar() && STEG[idx].type !== 'takk' && !confirm('Vil du slette svarene du har gitt og starte på nytt?')) return;
      svar = {}; innsendingId = null; redigerer = false; PG8.slett(KLADD); tilOppsummering = false; gaaTil(1);
    }
    else if (hva === 'neste') {
      const feil = feilISteg(STEG[idx]);
      if (feil) { visFeil(feil); return; }
      if (tilOppsummering) { tilOppsummering = false; gaaTil(STEG.length - 2); }
      else gaaTil(idx + 1);
    }
    else if (hva === 'tilbake') { tilOppsummering = false; gaaTil(idx - 1); }
    else if (hva === 'send' || hva === 'send-likevel') {
      const mangler = STEG.findIndex(function (st) { return feilISteg(st); });
      if (mangler > -1) { const feil = feilISteg(STEG[mangler]); tilOppsummering = true; gaaTil(mangler); visFeil(feil); return; }
      if (hva === 'send' && ubesvarte().length) {
        // Påminnelse før innsending
        window.scrollTo(0, 0);
        const boks = document.getElementById('ubesvart');
        if (boks) { boks.classList.add('blink'); boks.focus({ preventScroll: true }); setTimeout(function () { boks.classList.remove('blink'); }, 1200); }
        return;
      }
      sendInn(document.querySelector('[data-gaa="send"]') || g);
    }
    else if (hva === 'vis-ubesvarte') { visUbesvarte = !visUbesvarte; tegn(false); const b = document.getElementById('ubesvart'); if (b) b.focus({ preventScroll: true }); }
  });

  document.addEventListener('input', function (e) {
    const key = e.target.dataset && e.target.dataset.tekst;
    if (!key) return;
    svar[key] = e.target.value;
    lagreKladd();
  });

  /* Påkrevde spørsmål: q.krav(svar) gir en feilmelding, eller tom tekst når alt er i orden */
  function feilISteg(st) {
    if (!st || !st.sporsmal) return '';
    for (let i = 0; i < st.sporsmal.length; i++) {
      const q = st.sporsmal[i];
      if (q.krav && vises(q)) { const f = q.krav(svar); if (f) return f; }
    }
    return '';
  }

  function lagId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function sendInn(knappEl) {
    if (!PG8.innenFrist()) { visFeil('Svarfristen var ' + PG8.svarfristTekst() + ', og skjemaet er stengt.'); return; }
    if (!innsendingId) { innsendingId = lagId(); lagreKladd(); } // samme id ved nytt forsøk – lagres bare én gang
    const data = { id: innsendingId, runde: C.runde, versjon: C.versjon };
    const kontakt = { runde: C.runde, videre: svar.videre || [] };
    let harKontakt = false;
    Object.keys(svar).forEach(function (k) {
      if (!harSvar(svar[k])) return;
      if (k.indexOf('kontakt.') === 0) { kontakt[k.slice(8)] = svar[k]; harKontakt = true; }
      else data[k] = svar[k];
    });
    const hp = document.getElementById('hp');
    if (hp && hp.value) data.hp = hp.value;

    const liste = hentSendt();
    const forrige = liste.find(function (x) { return x.id === innsendingId; });
    if (forrige && JSON.stringify(forrige.kontakt || {}) === JSON.stringify(harKontakt ? kontakt : {})) harKontakt = false; // uendret kontaktinfo sendes ikke på nytt
    const ferdig = function () {
      const post = { id: innsendingId, tidspunkt: new Date().toISOString(), data: data, kontakt: harKontakt ? kontakt : (forrige ? forrige.kontakt : {}) };
      const i = liste.findIndex(function (x) { return x.id === innsendingId; });
      if (i > -1) liste[i] = post; else liste.push(post);
      PG8.lagre(SENDT, liste);
      PG8.slett(KLADD);
      sistRedigert = redigerer;
      svar = {}; innsendingId = null; redigerer = false; visUbesvarte = false;
      gaaTil(STEG.length - 1);
    };
    if (!C.endpoint) { ferdig(); return; }   // prototype: lagres bare i nettleseren

    const tekst = knappEl.innerHTML;
    knappEl.disabled = true; knappEl.textContent = 'Sender …';
    const post = function (body) {
      return fetch(C.endpoint, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // unngår CORS-forhåndssjekk mot Apps Script
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.feil || 'Feil'); return j; });
    };
    post({ type: 'svar', data: data })
      .then(function () { return harKontakt ? post({ type: 'kontakt', data: kontakt }).catch(function () {}) : null; })
      .then(ferdig)
      .catch(function () {
        knappEl.disabled = false; knappEl.innerHTML = tekst;
        visFeil('Svarene ble ikke sendt. Sjekk at du er koblet til internett, og trykk «Send inn» igjen. Svarene dine er lagret på denne enheten.');
      });
  }

  function visFeil(melding) {
    let boks = document.getElementById('feilboks');
    if (!boks) {
      boks = document.createElement('div');
      boks.id = 'feilboks'; boks.className = 'feilboks'; boks.setAttribute('role', 'alert');
      $steg.prepend(boks);
    }
    boks.textContent = melding;
    window.scrollTo(0, 0);
  }

  tegn(true);
})();
