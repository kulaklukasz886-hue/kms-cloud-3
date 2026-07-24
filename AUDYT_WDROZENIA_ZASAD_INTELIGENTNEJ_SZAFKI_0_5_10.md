# Audyt wdrożenia zasad Inteligentnej Szafki — etap 1

Data: 2026-07-23  
Fundament: KMS TESTOWY 2.9.13, reguły V1.6  
Moduł: Inteligentna Szafka TEST 0.5.10

## Zasady sprawdzone i działające

- IS-KMS-004–010: kolejność etapów, blokada frontów, obsługa pola, wysokość frontu, otwarta wnęka i zawias L/P.
- IS-CONSTR-001–002: kolejność H → W → D, korpus maks. 2794 mm, front maks. 2790 mm.
- IS-CONSTR-005 i KOR-KMS-002: standardowy element między bokami ma szerokość W − 2 × grubość boku.
- KOR-KMS-003: oba boki zachowują pełną głębokość D.
- IS-CONSTR-014–016: pojedyncze i podwójne ścianki/półki oraz półka stała konstrukcyjna.
- HDF-001–004: HDF 101P 3,2 mm; wariant bez frezu W−2/H−2; wariant w frezie W−14/H−9; odsunięcie rowka minimum 5 mm nie zmienia wymiaru HDF.
- IS-CONSTR-017: półka ruchoma jest elementem rozpiski, nie wymaga CNC i otrzymuje standard PCV dookoła.
- KMS-AI-WNETRZE-001–003: powtarzalna geometria pojedynczej i podwójnej ścianki oraz półki.

## Poprawki w wersji 0.5.10

1. Rozpiska zawiera bok lewy, bok prawy, dolny i górny wieniec standardowy.
2. Inna grubość korpusu niż 18 mm wymaga zaznaczenia świadomego wyjątku.
3. Dodano jawny wybór HDF: od tyłu bez frezu albo HDF w frezie.
4. HDF bez frezu liczy się W−2 × H−2.
5. HDF w frezie liczy się W−14 × H−9 niezależnie od odsunięcia rowka.
6. Rozpiska zawiera półki ruchome, półki stałe konstrukcyjne, ścianki działowe i półki na łączeniu.
7. Półki bez fizycznej ścianki wykorzystują pełną szerokość wolnej komory.
8. Ta sama geometria jest używana w 2D, 3D, rozpisce i przekazaniu do Etapu 1.

## Zasady częściowe — następna kolejność

- IS-CONSTR-003–004: niezależne ustawienia lewego i prawego boku.
- IS-CONSTR-006–013: warianty wieńców i trawersów.
- HDF-005: wpływ frezu na głębokość wybranych elementów zależnie od typu korpusu.
- MAT-PCV-001–017: materiały oraz indywidualne ustawienia PCV.
- COKOL-001–007 i AXILO-001–004: cokół, nóżki i klipsy.

## Niewdrażane bez decyzji właściciela

- KOR-GOR-003 i inne zasady oznaczone `DO UZUPEŁNIENIA`.
- Parametry frezu LED, jeśli nie ma zatwierdzonego programu parametrycznego.
- Geometria CNC bez pełnego punktu bazowego, średnicy, głębokości i strony obróbki.

