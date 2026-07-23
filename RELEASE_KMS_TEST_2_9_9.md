# KMS TESTOWY 2.9.7 — POPRAWKA NA PODSTAWIE ZIP Z GITHUBA

## Najważniejsze zmiany

- Wersja przygotowana bezpośrednio na rzeczywistym pakiecie z gałęzi `kms-test-analiza-zamowien`.
- Poprawiono silnik rozkroju: prawdziwy algorytm MaxRects 2D dzieli wszystkie przecinające się wolne prostokąty.
- Test regresyjny `240.REMIK` ma obowiązkowy wynik: 9 elementów na 1 płycie.
- Wymiary Etapu 2, CSV i HHA pozostają 1:1 — KMS nie pomniejsza ich za obrzeże.
- Pole INFO powstaje w Etapie 2 i zachowuje format `NR_ZLECENIA.KLIENT`, np. `240.REMIK`.
- Produkcja otrzymuje zbiorcze zapotrzebowanie: płyta netto, obrzeże produkcyjne netto i obrzeże do zamówienia z zapasem 20%.
- Formatki pozostają wewnętrznie w Etapie 2, CSV/HHA i silniku optymalizacji.
- Naprawiono plik katalogu, który w źródłowym ZIP-ie znajdował się w błędnie nazwanym pliku tekstowym.
- Pełny katalog backendu zawiera 5784 warianty produktów pięciu producentów/grup: EGGER, JUAN / INNI, NIEMANN POLSKA, SWISS KRONO i WOODECO.
- Szybki selektor w głównym ekranie zachowuje katalog JUAN/EGGER: 5161 wariantów zagregowanych do 276 symboli.
- Zachowano Inteligentną Szafkę 0.5.5: bok maks. 2794 mm, front maks. 2790 mm oraz niezależny wybór zawiasu L/P.

## Test referencyjny 240.REMIK

- 610 × 501 — 2 szt.
- 974 × 597 — 1 szt.
- 974 × 360 — 2 szt.
- 561 × 360 — 1 szt.
- 597 × 378 — 2 szt.
- 1012 × 400 — 1 szt.

Wynik testu automatycznego:

- 9 fizycznych elementów,
- 1 fizyczna płyta,
- zapotrzebowanie netto 0,5 płyty,
- obrzeże 2MM netto 15,625 mb,
- obrzeże 2MM do zamówienia 18,750 mb.
