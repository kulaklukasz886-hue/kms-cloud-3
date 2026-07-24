# Audyt wdrożenia wieńców — Inteligentna Szafka 0.5.11

Data: 2026-07-24  
Fundament: KMS TESTOWY 2.9.13, reguły V1.6

## Wdrożone reguły

- **IS-CONSTR-005:** dolny wieniec standardowy jest między bokami: W − lewy bok − prawy bok.
- **IS-CONSTR-006:** dolny wieniec od dołu ma pełną szerokość W, boki są krótsze o grubość wieńca, a gabaryt H pozostaje bez zmian.
- **IS-CONSTR-008:** standardowy górny wieniec jest między bokami i ma PCV z przodu.
- **IS-CONSTR-009:** górny wieniec od góry rodzaju 1 ma pełne W i D, PCV dookoła, frez z tyłu 5 mm; boki są krótsze o 18 mm, a front pozostaje bez dodatkowego skrócenia.
- **IS-CONSTR-010:** górny wieniec od góry rodzaju 2 ma pełne W, indywidualną głębokość i wystawienie przed front; boki są krótsze o 18 mm, a front o dodatkowe 20 mm.
- **IS-CONSTR-011:** dla H720×W600 rodzaj 2 daje boki 702 mm i front 696×596 mm.

## Ważna korekta wspólna

Standardowy front otrzymuje luz 2 mm z góry i 2 mm z dołu. Dlatego dla H720 wysokość frontu wynosi 716 mm, a dla rodzaju 2 po dodatkowym skróceniu 20 mm wynosi 696 mm. Maksymalny korpus 2794 mm nadal daje maksymalny front 2790 mm.

## Testy referencyjne

1. H720×W600×D560, T18, oba wieńce standardowe:
   - bok: 720×560,
   - dolny i górny wieniec: 560×564,
   - front: 716×596.
2. Dolny wieniec od dołu:
   - bok: 702×560,
   - dolny wieniec: 560×600.
3. Górny wieniec od góry — rodzaj 1:
   - bok: 702×560,
   - górny wieniec: 560×600,
   - front: 716×596.
4. Górny wieniec od góry — rodzaj 2, głębokość 400:
   - bok: 702×560,
   - górny wieniec: 400×600,
   - front: 696×596.

