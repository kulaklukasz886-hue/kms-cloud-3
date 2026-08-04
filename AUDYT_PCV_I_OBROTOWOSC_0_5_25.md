# Audyt 0.5.25 — różne PCV i obrotowość katalogowa

## Zakres

Poprawka dotyczy wyłącznie wersji testowej KMS 2.9.13.

- Zachowano dokładnie 17 kolumn CSV.
- `OBROTOWO` pozostaje w kolumnie 10.
- Nie zmieniono `main`.

## Różne PCV w jednym dekorze

Analiza arkusza zapamiętuje kod PCV obowiązujący dla konkretnego bloku pozycji.
Zmiana kodu w dalszej części arkusza zmienia PCV wyłącznie dla kolejnych wierszy.

Przykład kontrolny:

- pierwsza grupa W960 ST7 → `PCV H1714 ST19`,
- druga grupa W960 ST7 → `PCV H1385 ST37`.

Oba symbole pozostają oddzielne w polu `Element`, czyli w drugiej kolumnie CSV.

## Obrotowość

Decyzja zatwierdzona w katalogu ma pierwszeństwo przed wartością zapisaną wcześniej
w zleceniu. Dzięki temu W960 ST7 otrzymuje `1` w kolumnie 10 również wtedy, gdy
stary stan zlecenia zawierał `0`.

Dla materiału bez decyzji katalogowej pozostaje dotychczasowa wartość ręczna.

## Kontrole

- dwa różne PCV w jednym arkuszu: zaliczone,
- katalogowa wartość `1` nadpisuje stary stan `0`: zaliczone,
- `OBROTOWO` w kolumnie 10: zaliczone,
- 17 pól CSV: zaliczone,
- składnia API i skryptów `index.html`: zaliczona.
