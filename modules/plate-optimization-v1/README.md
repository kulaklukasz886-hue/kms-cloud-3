# KMS Plate Optimization v1

Izolowany moduł prognozowania liczby fizycznych płyt dla KMS.

## Status

- wersja: `1.0.0-alpha.2`,
- moduł badawczo-testowy,
- niepodłączony do stabilnego KMS,
- `enabled: false`,
- nie podejmuje automatycznej decyzji zakupowej,
- nie generuje NCR,
- nie zastępuje finalnej optymalizacji HolzHer.

## Nadrzędny przepływ

```text
KMS → wymiary nominalne/gotowe + dane technologiczne + HHA
HolzHer → odczyt HHA → korekty PCV → finalna optymalizacja → NCR → cięcie
```

## Zasada PCV

Moduł nie pomniejsza wymiarów elementów z powodu PCV 2 mm. Informacja o obrzeżu jest zachowywana jako metadane technologiczne. Korekta wymiarów pozostaje po stronie optymalizacji HolzHer.

## Wdrożony silnik alpha.2

Silnik wykorzystuje deterministyczne, wielostartowe pakowanie gilotynowe:

- różne kolejności formatek,
- różne heurystyki wyboru wolnego pola,
- różne kierunki podziału,
- różne strategie wyboru płyty,
- rzaz 4,4 mm,
- kontrolę obrotowości,
- niezależną walidację kompletności, geometrii i drzewa cięć.

Układ niekompletny, kolizyjny, wychodzący poza pole robocze albo niegilotynowy jest odrzucany przed porównaniem liczby płyt.

## Wynik referencyjny 320.REMIK

Dla danych wejściowych przekazywanych do HHA, bez korekty PCV w KMS:

- 33 wiersze,
- 96 formatek,
- 1 grupa materiałowa,
- 5 fizycznych płyt,
- 0 elementów nieułożonych,
- 0 kolizji,
- wszystkie płyty gilotynowe,
- dolna granica pola roboczego: 5 płyt.

Wynik 5 oznacza liczbę płyt wykorzystanych przez testową symulację. Nie jest jeszcze automatyczną liczbą płyt do zamówienia.

## Rozdzielone wartości

- `physicalBoardCount` — liczba płyt wykorzystanych przez bezpieczny układ testowy,
- `purchasePlan.status` — stan przyszłego planowania zakupu,
- `purchasePlan.newBoardsToPurchase` — pozostaje `null`,
- `automaticPurchasingAllowed` — zawsze `false` na tym etapie.

## Parametry bazowe

- płyta handlowa: 2800 × 2070 mm,
- pole robocze: 2770 × 2040 mm,
- rzaz: 4,4 mm,
- maksymalny wymiar elementu: 2770 mm.

## Testy

```bash
npm test
```

Testy kontrolują brak korekty PCV w KMS, grupowanie materiałów, 96 formatek Remika, 5 płyt, rzaz, brak kolizji, gilotynową wykonalność, deterministyczność i blokadę automatycznego zakupu.

## Ograniczenia przed integracją

1. `320.REMIK` jest pierwszym przypadkiem referencyjnym, a nie pełnym dowodem jakości silnika.
2. Należy dodać kolejne rzeczywiste zlecenia i porównać wynik z HolzHer.
3. Wykrywanie i wycena resztek wymaga osobnej kalibracji.
4. `PurchasePlan` musi później uwzględnić magazyn, resztki, łączenie zleceń i akceptację właściciela.
5. Do KMS wynik może trafić najpierw wyłącznie jako informacja testowa.
