# Prototype – skjema og felles oversikt

Åpne `index.html` (spørreskjemaet) eller `oversikt.html` (felles oversikt) direkte i nettleseren. Ingen installasjon trengs.

| Fil | Innhold |
|---|---|
| `index.html` | Spørreskjemaet (individuelt) – det er denne adressen som sendes ut |
| `oversikt.html` | Felles oversikt for alle beboere |
| `assets/sporsmal.js` | **Alle spørsmål og innstillinger** (svarfrist, antall husstander, kontaktperson). Endre tekster her. |
| `assets/skjema.js` | Skjemamotoren – tegner spørsmålene, autolagrer, sender inn |
| `assets/aggreger.js` | Regner ut samlede resultater. Samme fil ligger i Apps Script som `Aggreger.gs` |
| `assets/felles.js` | Felles hjelpere, tekststørrelse og datoer |
| `assets/oversikt.js` | Tegner oversiktssiden |
| `assets/demodata.js` | **Eksempeldata** (17 oppdiktede svar, sitater, vedlikeholdsliste). Fjernes ved lansering. |
| `assets/style.css` | Utseende |

## To moduser

- **Uten tilkobling** (`endpoint: ''`): fellessiden viser eksempeldata, og svar lagres bare i nettleseren. Et gult bånd øverst sier fra.
- **Med tilkobling** (`endpoint` = web-app-URL fra Apps Script): svar sendes til regnearket, og fellessiden henter samlede tall, publiserte sitater og vedlikeholdslisten derfra. Eksempeldata brukes ikke.

Oppsett av regneark og Apps Script: se [../apps-script/OPPSETT.md](../apps-script/OPPSETT.md).

## Før lansering

1. Legg inn i `PG8.CONFIG` i `sporsmal.js`: `endpoint`, `husstander`, `kontakt`, `hjelp`.
2. Sett `utsendt` til datoen meldingen sendes, f.eks. `'2026-10-19'`. Svarfrist (7 dager) og runde 2 regnes ut automatisk.
3. Publiser endringene (se under).

## Test lokalt før publisering

Fra prosjektmappen (en mappe opp):

    node apps-script/test/lokal-server.js

Åpne http://localhost:8649. Siden leses rett fra denne mappen, og svar går til et etterlignet regneark som starter med 17 eksempelsvar. Se regnearket på http://localhost:8649/regneark. Stopp med Ctrl+C.

## Publisering

Nettsiden ligger på GitHub Pages: **https://andreasfadum.github.io/pavelsgate8/** (skjemaet) og **…/oversikt.html** (felles oversikt).
Kode: https://github.com/andreasfadum/pavelsgate8. Endringer i denne mappen publiseres med `git commit` og `git push`; siden er oppdatert etter et par minutter.

## Ny runde

Lag nye spørsmål i `sporsmal.js`, sett `runde: 2` og nytt `versjon`, og sett `utsendt` til ny startdato. Sett også `svarfrist`, og legg inn `RESULTATER_FRA` for den nye runden i `apps-script/Kode.gs` (dagen etter fristen). Resultatene på oversikten er skjult til da. Svarene fra hver runde holdes adskilt i regnearket.
