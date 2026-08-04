# KMS TEST 2.9.13 — analiza plików 0.5.16

Data: 2026-07-28  
Gałąź docelowa: `test-v1.6-2.9.13-audyt-kms002`

## Zakres poprawki

1. Pełna nazwa materiału, np. `H3303 ST10 Dąb Hamilton naturalny`, jest normalizowana do zatwierdzonego symbolu `H3303 ST10`.
2. Normalizacja wybiera najdłuższy pasujący symbol katalogowy, więc `U702 ST9 Kaszmir` nie zostanie błędnie przypisany do `U702 PM`.
3. Każdy dodawany plik otrzymuje odcisk SHA-256.
4. Ponowne dodanie identycznego pliku do tego samego zlecenia jest blokowane przed wywołaniem analizy AI.
5. Pliki o tej samej nazwie, ale różnej zawartości, pozostają dozwolone.

## Wyniki testów przed poprawką

- CSV kontrolny: 3/3 pozycji, 100%.
- XLSX kontrolny: 3/3 pozycji, 100%.
- PDF kontrolny: 3/3 pozycji, 100%.
- PNG kontrolny: 3/3 pozycji, 98%.
- Nieobsługiwany TXT: prawidłowo zablokowany.
- Wiele źródeł: działa, ale identyczny plik tworzył duplikaty.
- `Łazienka (1).xlsx`: 4 pozycje i wymiary odczytane, lecz pełna nazwa `H3303 ST10 Dąb Hamilton naturalny` była odrzucana.

## Weryfikacja techniczna poprawki

- Składnia wszystkich skryptów osadzonych w `index.html`: poprawna.
- Testy normalizacji:
  - `H3303 ST10 Dąb Hamilton naturalny` → `H3303 ST10`;
  - `EGGER H3303 ST10 Dąb Hamilton naturalny` → `H3303 ST10`;
  - `U702 ST9 Kaszmir` → `U702 ST9`;
  - nieznany materiał pozostaje nierozpoznany i wymaga kontroli człowieka.
- Identyczne dane pliku dają identyczny SHA-256; różna zawartość daje inny odcisk.

## Ograniczenia bezpieczeństwa

- Poprawka nie zatwierdza automatycznie Etapu 1.
- Nie wysyła zleceń do produkcji ani chmury.
- Nie dopasowuje nieznanego materiału „na siłę”.
- Wdrożenie wyłącznie na gałąź testową po ręcznym wgraniu plików.
