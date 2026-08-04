# Audyt PCV specjalnego — 0.5.20

## Plik referencyjny

`960 okleina lincoln 1714.xlsx`

## Źródło danych

W nagłówku arkusza znajduje się zapis:

`W960ST7  PCV H1714 st19`

Oddzielnie arkusz podaje grubość obrzeża:

`PCV 1`

## Reguła

- materiał płyty: `W960 ST7`,
- kod specjalnego obrzeża: `PCV H1714 ST19`,
- grubość obrzeża: `1MM`,
- kod `PCV H1714 ST19` trafia do pola `Element`,
- pole `Element` jest eksportowane do drugiej kolumny 17-kolumnowego CSV,
- reguła nie zamienia kodu specjalnego obrzeża na materiał płyty i nie zmienia liczby krawędzi.

## Zakres wdrożenia

Zmiana dotyczy wyłącznie API analizy zamówień: `api/analyze-order.js`.
