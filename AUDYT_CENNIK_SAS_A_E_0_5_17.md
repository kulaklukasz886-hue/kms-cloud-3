# Audyt wdrożenia — Cennik SAS A–E 0.5.17

- Źródło nadrzędne: Google Sheets „KMS — CENNIK SAS A–E — DO WDROŻENIA”.
- Wersja: `KMS-SAS-AE-2026-07-27-V2`.
- Import: zakładka `KMS_IMPORT`, wyłącznie pozycje `AKTYWNY=TAK`.
- Liczba pozycji: 4649.
- Docelowa gałąź: `test-v1.6-2.9.13-audyt-kms002`.

## Zakres pierwszego wdrożenia

- moduł „Cennik SAS” w menu KMS TESTOWY,
- wyszukiwanie po symbolu i nazwie dekoru,
- filtr grubości,
- wybór grupy klienta A–E,
- rabat indywidualny zlecenia,
- obliczenie ceny końcowej brutto za m²,
- wersja i data cennika widoczne w module,
- API przeglądarkowe `window.KmsSasPricing` do dalszego spięcia z kartą klienta i zleceniem.

## Bezpieczeństwo

- źródłowy prywatny arkusz nie jest pobierany przez przeglądarkę użytkownika,
- aplikacja używa kontrolowanej, wersjonowanej kopii danych,
- wdrożenie nie zmienia produkcji, CSV, faktur ani danych wersji stabilnej,
- ceny specjalne i wyjątki wymagają osobnego etapu z historią zmian i uprawnieniami administratora.
