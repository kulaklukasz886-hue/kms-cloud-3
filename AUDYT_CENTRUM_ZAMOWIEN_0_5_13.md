# Audyt 0.5.13 — Centrum zamówień

## Cel

Ograniczenie przeciążenia informacyjnego przy dużej liczbie zamówień.

## Wdrożone zasady

- Lista jest domyślnie sortowana od najstarszego zamówienia u góry do najnowszego na dole.
- Nowe zamówienie nie przeskakuje na początek listy.
- Dodano boczne foldery: Wszystkie, Nowe, Do analizy, Do poprawki, Pilne, Gotowe do zamówienia i W realizacji.
- Każdy folder pokazuje licznik pozycji.
- Ostatnio otwarty folder jest zapamiętywany lokalnie.
- Dodano wyszukiwanie po numerze zlecenia i kliencie.
- Priorytet `PILNA POPRAWKA KLIENTA` jest wyróżniony, ale nie zmienia chronologicznej kolejności.
- Szczegóły zlecenia są otwierane dopiero przyciskiem `Otwórz`.

## Koszyk dostawców

Koszyk korzysta z istniejącego kontrolowanego grupowania materiałów według dostawcy. Obowiązuje kolejność wyboru `JUAN → SAS → DO RĘCZNEJ WERYFIKACJI` wdrożona w 0.5.12.

## Ograniczenie

Zmiana jest przeznaczona wyłącznie do testów na gałęzi `test-v1.6-2.9.13-audyt-kms002`.
