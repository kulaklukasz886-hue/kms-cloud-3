# KMS TEST 2.9.13 — audyt Centrum zamówień 0.5.14

## Zakres

Poprawka dotyczy wyłącznie widoku Centrum zamówień w `index.html`.
API, baza danych, role oraz moduły produkcyjne nie zostały zmienione.

## Znaleziony błąd

W pliku działały dwie implementacje `oaRenderOrdersList()`.
Nowsza implementacja obsługiwała:

- foldery i liczniki,
- wyszukiwanie po numerze zlecenia i kliencie,
- wyróżnienie priorytetu `PILNA POPRAWKA KLIENTA`,
- komunikat pustego aktywnego folderu.

Późniejsza, starsza deklaracja nadpisywała tę implementację podczas
uruchamiania strony.

## Wprowadzona poprawka

Wyłączono wyłącznie późniejszą, starszą deklarację funkcji.
Aktywna pozostała implementacja 0.5.13 z folderami, licznikami,
wyszukiwaniem i priorytetem pilnej poprawki.

## Test właściciela

1. Otwórz `Analiza zamówień 1→2→3`.
2. Sprawdź działanie wszystkich folderów i ich liczników.
3. Wyszukaj zlecenie po numerze i nazwie klienta.
4. Sprawdź, czy nowe zlecenie znajduje się na dole listy.
5. Sprawdź wyróżnienie zlecenia z priorytetem `PILNA POPRAWKA KLIENTA`.

## Ograniczenie

Pakiet jest przeznaczony wyłącznie na gałąź
`test-v1.6-2.9.13-audyt-kms002`.
Nie należy wgrywać go na `main`.
