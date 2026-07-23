# KMS TESTOWY 2.9.13 — AUDYT V1.6 + KMS-002

## Fundament
- Kod aplikacji: działająca wersja KMS TESTOWY 2.9.12 z gałęzi `kms-test-analiza-zamowien`.
- Reguły: kanoniczny rejestr V1.6 z 2026-07-22.
- Status: wyłącznie TEST. Gałąź `main` nie jest częścią paczki i nie wolno jej podmieniać bez testów.

## Wprowadzone poprawki
1. KMS-002: jeden kontrolowany mechanizm synchronizacji zleceń i komunikacji co 3 minuty.
2. Synchronizacja jest zatrzymywana w ukrytej karcie i po wylogowaniu; wraca po ponownym pokazaniu karty.
3. Ręczny przycisk „Odśwież teraz” odświeża zlecenia i komunikację bez uruchamiania drugiego timera.
4. CORE-002/003: wymiary między 2770×2040 a 2800×2070 zachowane 1:1 i oznaczane `CIĘCIE Z RĘKI`; element większy od pełnej płyty blokuje zatwierdzenie i wymaga świadomego podziału.
5. TECH-001: 36MM tworzy dwa fizyczne elementy 18 mm, +20 mm do obu wymiarów, ELEMENT=`36MM`.
6. TECH-002/003: 28MM tworzy osobno warstwę 18 mm wybranego materiału i 10 mm `W960 SM`, obie +20 mm; optymalizator nie mnoży ich ponownie.
7. CORE-009/010/011: CSV ma dokładnie 12 kolumn, jest rozdzielony według dokładnego materiału i grubości, a nazwa zawiera numer, klienta, materiał i grubość.
8. AUDIT-UPDATE-001/002: dodano osobny CSV etykiet frontów; każdy front ma osobny wiersz, ilość 1, a ELEMENT zachowuje dokładny symbol, np. `A/1.1`.
9. CAT-009: zapis obrzeża 2 mm w CSV to `2MM`.
10. Zlecenie zapisuje `rulesVersion: V1.6` przy zatwierdzeniu.
11. Dokument źródłowy lub świadomie wybrany tryb ręczny/Inteligentna Szafka są widocznym warunkiem Etapu 1.
12. Zachowano działający Kreator Rozkroju TEST 0.8.1: 2800×2070, pole 2770×2040, rzaz 4,4 mm, regresja 240.REMIK.

## Nie zmieniono
- logowania Supabase i uprawnień stanowisk,
- działającej architektury wersji 2.9.12,
- geometrii plików CNC/MPRX,
- odłożonych tematów: pełny proces szuflad, nowy MPRX i parametryczny frez LED.

## Obowiązkowe testy Preview
1. Logowanie i wylogowanie.
2. Ukrycie karty na minimum 4 minuty i kontrola braku mnożenia żądań.
3. Zlecenie standardowe CSV 12 kolumn.
4. Element 2790×2050 — `CIĘCIE Z RĘKI`, bez zmiany wymiarów.
5. Element większy niż 2800×2070 — widoczna blokada.
6. 36MM — dwa fizyczne elementy 18 mm.
7. 28MM — dwa osobne CSV: materiał 18 mm i W960 SM 10 mm.
8. Fronty A/1.1, A/1.2 — osobne wiersze, ilość 1, symbol w ELEMENT.
9. Test 240.REMIK — 9 elementów na jednej płycie.
10. Odświeżenie strony i ponowne otwarcie zlecenia.
