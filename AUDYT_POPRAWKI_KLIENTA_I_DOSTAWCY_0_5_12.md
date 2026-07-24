# Audyt 0.5.12 — pilna poprawka klienta i dostawcy

## Pilna poprawka klienta

- Zlecenie można przywrócić do poprawki tylko przed rozpoczęciem produkcji i zamawiania materiałów.
- Operacja wymaga podania powodu i potwierdzenia.
- Zlecenie otrzymuje priorytet `PILNA POPRAWKA KLIENTA`.
- Etap 2 wraca do kontroli, akceptacja Etapu 2 jest cofana, a Etap 3 jest usuwany.
- Zapisywane są: powód, czas, użytkownik oraz źródło cennika.
- Do dokumentów zlecenia automatycznie przypinany jest kontrolowany cennik SAS EGGER EDC2026.

## Wybór dostawcy

1. Dla pozycji domyślnie kierowanej do JUAN program sprawdza dokładny symbol i grubość w Katalogu KMS.
2. Jeżeli istnieje zgodna pozycja JUAN, pozostaje dostawca JUAN.
3. Jeżeli brak pozycji JUAN, ale istnieje zgodna pozycja SAS, dostawcą zostaje SAS.
4. Jeżeli brak zgodnej pozycji u obu dostawców, wynik to `DO RĘCZNEJ WERYFIKACJI`.
5. Program nie przypisuje ceny ani dostawcy na podstawie podobnej nazwy.

## Źródło SAS

- Plik: `KMS — Katalog SAS EGGER EDC2026 — od 23.03.2026 — FINAL`.
- Arkusz zawiera kontrolowane katalogi płyt, obrzeży i blatów.
- Obowiązywanie cen: od 2026-03-23.

## Ograniczenie

Zmiana pozostaje wyłącznie na gałęzi testowej. Nie wolno przenosić jej na `main` bez testu właściciela.
