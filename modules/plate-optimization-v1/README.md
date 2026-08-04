# KMS Plate Optimization v1

Izolowany moduł prognozowania liczby płyt dla KMS.

## Status

- moduł badawczo-testowy,
- niepodłączony do `main`,
- nie podejmuje automatycznej decyzji zakupowej,
- nie generuje NCR,
- nie zastępuje optymalizacji HolzHer.

## Nadrzędny przepływ

```text
KMS → wymiary nominalne/gotowe + dane technologiczne + HHA
HolzHer → odczyt HHA → korekty PCV → finalna optymalizacja → NCR → cięcie
```

## Zasada PCV

Moduł nie pomniejsza wymiarów elementów z powodu PCV 2 mm. Informacja o obrzeżu jest przechowywana i przekazywana dalej, ale korekta wymiarów pozostaje po stronie optymalizacji HolzHer.

## Cel wersji v1

1. Walidować wejście.
2. Grupować elementy wyłącznie po materiale, dekorze i grubości.
3. Prognozować liczbę fizycznych płyt dla każdej grupy.
4. Odrzucać układy niekompletne, kolizyjne, wychodzące poza pole robocze lub niewykonalne na pile panelowej.
5. Zwracać osobno:
   - `physicalBoardCount`,
   - `purchasePlan.status`,
   - `purchasePlan.newBoardsToPurchase`.
6. Pozostawiać `newBoardsToPurchase = null`, dopóki nie zostaną uwzględnione magazyn, resztki, łączenie zleceń i akceptacja właściciela.

## Parametry bazowe

- płyta handlowa: 2800 × 2070 mm,
- pole robocze: 2770 × 2040 mm,
- rzaz: 4,4 mm,
- maksymalny wymiar elementu: 2770 mm.

## Warunek użycia wyniku

Wynik może zostać pokazany w KMS wyłącznie jako testowy, gdy jednocześnie:

- `complete === true`,
- `geometryValid === true`,
- `panelCutFeasible === true`,
- `materialGroupsValid === true`,
- `purchasePlan.status !== "approved"`.

Automatyczne zamawianie pozostaje zablokowane do czasu zatwierdzenia kolejnych przypadków referencyjnych.