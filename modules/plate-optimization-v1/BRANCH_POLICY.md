# KMS Plate Optimization — polityka separacji gałęzi

## Nadrzędna zasada

Moduł optymalizacji płyt jest rozwijany wyłącznie na gałęzi:

`feature/kms-optymalizacja-plyt-v1`

Prace odbudowy KMS prowadzone przez Codexa na lokalnej gałęzi `recovery` są całkowicie niezależne.

## Zakazane operacje

Bez wyraźnej zgody właściciela nie wolno:

- scalać tej gałęzi bezpośrednio do `main`,
- scalać tej gałęzi bezpośrednio do `recovery`,
- wykonywać rebase tej gałęzi na `recovery`,
- wykonywać cherry-picków do `recovery`,
- kopiować całego drzewa repozytorium między gałęziami,
- uruchamiać deployu,
- podmieniać plików odbudowywanych przez Codexa.

## Dopuszczona późniejsza integracja

Po zakończeniu i zatwierdzeniu recovery należy:

1. utworzyć nową gałąź `integration/kms-optymalizacja-*` z zatwierdzonego punktu recovery,
2. przenieść wyłącznie katalog `modules/plate-optimization-v1/`,
3. ręcznie przenieść tylko niezbędne wpisy testowe i integracyjne,
4. porównać listę zmienionych plików,
5. uruchomić pełne testy KMS,
6. wykonać merge dopiero po akceptacji właściciela.

## Dozwolone gałęzie dla testów modułu

- `feature/kms-optymalizacja-plyt-v1`,
- gałęzie zaczynające się od `integration/kms-optymalizacja-`.

Testy modułu mają być blokowane na `main`, `recovery` i `recovery/*`.
