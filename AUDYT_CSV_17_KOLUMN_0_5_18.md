# Audyt poprawki CSV 0.5.18

## Źródła porównania

- błędny eksport KMS: `292.ANTROPIK_H2033_ST10_18MM.csv`,
- działający wzorzec: `138_FABIANSKI_U999_ST7.csv`.

## Potwierdzony format

- 17 kolumn rozdzielonych średnikiem,
- bez nagłówka i bez BOM,
- zakończenia wierszy CRLF,
- kolumna 1: pole `Info 1`,
- kolumna 2: oznaczenie elementu,
- kolumna 3: kolejny numer pozycji,
- kolumna 4: materiał,
- kolumny 5–8: długość, szerokość, ilość, grubość,
- kolumna 9: wartość techniczna `0`,
- kolumna 10: `OBROTOWO` (`0` albo `1`),
- kolumny 11–14: obrzeża zapisane jako `1mm` lub `2mm`,
- kolumny 15–17: puste.

## Poprawka

Generator podstawowego CSV oraz CSV etykiet frontów zapisuje teraz dokładnie 17 pól. Znaczenie kolumn 1–3 zostało doprecyzowane w audycie 0.5.19: `Info 1`, `Element`, `Pozycja`. Zachowano grupowanie według dokładnego materiału i grubości oraz dotychczasową blokadę nieprawidłowej wartości `OBROTOWO`.
