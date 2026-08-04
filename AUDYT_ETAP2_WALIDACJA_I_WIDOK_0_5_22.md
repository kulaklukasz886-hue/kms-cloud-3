# Audyt 0.5.22 — walidacja i widok Etapu 2

## Naprawiona fałszywa blokada

Pozycja nie jest już uznawana za indywidualny front tylko dlatego, że katalog lub reguła technologiczna określa ją jako front.

Blokada ilości większej niż 1 działa wyłącznie wtedy, gdy pozycja ma jawne oznaczenie `indywidualny` albo techniczne pole `individualSymbol=true`.

Przykład z testu: materiał `H1714 ST19`, ilość `2`, bez jawnego oznaczenia indywidualnego — pozycja jest prawidłowa i nie blokuje zatwierdzenia Etapu 2.

## Widok szczegółów

- tabela Etapu 2 została zwężona,
- pola liczbowe i obrzeża mają kompaktowe szerokości,
- kolumny CNC i uwag są krótsze,
- przy typowej szerokości komputera wszystkie funkcje jednego elementu są widoczne bez przesuwania w bok,
- na ekranach poniżej 1100 px pozostaje awaryjne przewijanie, aby nie ucinać danych.
