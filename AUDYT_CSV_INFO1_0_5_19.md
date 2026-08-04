# Audyt poprawki CSV Info 1 — 0.5.19

## Ustalenie

Na podstawie kontroli importu w programie produkcyjnym potwierdzono:

- kolumna 1: `Info 1`,
- kolumna 2: `Element`,
- kolumna 3: `Pozycja`.

## Poprawka

Generator CSV ponownie wpisuje do kolumny `Info 1` identyfikator zlecenia i klienta, np. `292.ANTROPIK`, w każdym wierszu eksportu. Kolumna `Element` zachowuje indywidualne oznaczenie elementu, a `Pozycja` otrzymuje kolejny numer.

Pozostały układ 17 kolumn, kodowanie, separator, CRLF, `OBROTOWO` oraz obrzeża pozostają bez zmian względem wersji 0.5.18.
