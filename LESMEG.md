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
3. Publiser mappen (GitHub Pages eller Netlify), og legg URL-en i meldingen.

## Ny runde

Lag nye spørsmål i `sporsmal.js`, sett `runde: 2` og nytt `versjon`, og sett `utsendt` til ny startdato. Svarene fra hver runde holdes adskilt i regnearket.
