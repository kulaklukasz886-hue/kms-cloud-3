# KMS TESTOWY 2.10.0 — WERSJA PO AUDYCIE V1.6

**Status:** DO TESTÓW NA RZECZYWISTYCH ZLECENIACH  
**Baza:** KMS TESTOWY 2.9.12  
**Moduł Inteligentna Szafka:** 0.6.0-post-audit-v1.6  
**Źródło reguł:** `KMS_INTELIGENTNA_SZAFKA_REJESTR_REGUL_V1_6.md`

## Cel wydania

To jest pierwsza wersja przygotowana do pracy po audycie. Jej zadaniem jest uruchomienie zatwierdzonego przepływu na prawdziwych zleceniach, zebranie uwag i wykonanie audytu powdrożeniowego przed dalszym rozwijaniem CNC.

## Najważniejsze wdrożenia

- Inteligentna Szafka przekazuje formatki bezpośrednio do widocznego Etapu 2 tego samego zlecenia.
- Etap 2 pozostaje obowiązkowym ekranem kontroli człowieka i pozwala właścicielowi poprawić wszystkie dane produkcyjne.
- Finalny CSV ma dokładnie 12 kolumn, zachowuje wymiary bez zaokrąglania i jest rozdzielany według dokładnego materiału oraz grubości.
- Technologia 36MM zapisuje `36MM` w ELEMENT, dodaje po 20 mm do obu wymiarów i tworzy właściwą liczbę fizycznych warstw.
- Technologia 28MM tworzy warstwę 18 mm z wybranego materiału oraz warstwę 10 mm `W960 SM`, w osobnych grupach materiałowych.
- Fronty z symbolami, np. `A/1.1`, pozostają osobnymi pozycjami z ilością 1 w CSV do etykiet.
- Zaimplementowano zatwierdzone formuły korpusu, frontów, wieńców, HDF, cokołu i podstawowe reguły PCV.
- Model SZ przechowuje konstrukcję i układ frontów, ale materiały oraz PCV wybiera się na nowo dla każdego zlecenia.
- Poprzednia aktywna dokumentacja jest unieważniana po zmianie danych i wymaga ponownego zatwierdzenia.

## CNC — zakres świadomie odłożony

W tym wydaniu nie rozwijamy nowych programów MPRX, geometrii CNC, parametrycznego frezu LED ani pełnego procesu szuflady. Zachowana jest możliwość przypisania istniejącego pliku lub rysunku do konkretnej pozycji. Brak nieopracowanego CNC jest pokazany jawnie; KMS nie zgaduje.

Do pełnego CNC wracamy po:
1. wdrożeniu tej wersji,
2. testach na realnych zleceniach,
3. audycie powdrożeniowym,
4. zatwierdzeniu paczki poprawek przez Łukasza.

## Zakres wymagający testów produkcyjnych

Etykiety QR, pełne kompletowanie, dorobienia R1/R2 oraz dalsze statusy produkcyjne pozostają częścią audytu V1.6, ale wymagają sprawdzenia w rzeczywistym środowisku i nie są w tym wydaniu deklarowane jako w pełni zweryfikowane end-to-end.

## Weryfikacja techniczna

- kontrola składni JavaScript: PASS,
- test formuł H720 × W600: PASS,
- test frontów 140 / 284 / 284: PASS,
- test CSV 12 kolumn i rozdzielenia materiał + grubość: PASS,
- test mapowania 28MM i 36MM: PASS,
- pełny test przeglądarkowy end-to-end: nie został wykonany z powodu ograniczeń środowiska testowego.

## Zasada wdrożenia

To nadal wersja TESTOWA. Do wersji STABLE przechodzi dopiero po testach i świadomej akceptacji Łukasza Kułaka.
