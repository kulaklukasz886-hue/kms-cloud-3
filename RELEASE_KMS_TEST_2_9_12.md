# KMS TESTOWY 2.9.10

## Naprawa blokady Etapu 1 po ręcznej korekcie

- Gdy użytkownik ręcznie wybierze dokładny symbol z Katalogu KMS, system zapisuje status katalogowy `OK`.
- Jednocześnie automatycznie usuwa flagę `uncertain`, która wcześniej pozostawała aktywna mimo zielonego komunikatu „Symbol potwierdzony w Katalogu KMS”.
- Wiersz przestaje być podświetlany na różowo.
- Walidator Etapu 1 nie zgłasza już błędu „pozycja oznaczona jako niepewna” dla poprawionej pozycji.

Pozostałe funkcje wersji 2.9.9 pozostają bez zmian.

- Przy otwarciu istniejącego zlecenia system ponownie sprawdza zielone symbole i automatycznie usuwa starą blokadę bez konieczności ponownego klikania każdego wiersza.
