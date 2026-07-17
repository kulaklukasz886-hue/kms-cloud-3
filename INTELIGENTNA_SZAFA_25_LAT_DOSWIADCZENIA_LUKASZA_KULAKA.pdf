# Meble KMS — moduł TEST 0.1.2

## Status
Wyłącznie wersja testowa. Nie podłączać do STABLE bez decyzji Łukasza Kułaka.

## Uruchomienie samodzielne
Otwórz `index.html`. Pliki `assets/kms-meble.css` i `assets/kms-meble.js` muszą pozostać w katalogu `assets`.

## Podpięcie do KMS TEST
Najprostszy wariant: osadzić `index.html` jako widok modułu lub iframe. Moduł emituje zdarzenia:

- `kms:meble:ready` — moduł gotowy,
- `kms:meble:state-changed` — zmienił się zestaw szafek,
- `kms:meble:stage1-ready` — użytkownik zatwierdził przejście do Etapu 1.

Przy osadzeniu w iframe te same dane są wysyłane przez `postMessage` ze źródłem `KMS_MEBLE_MODULE`.

## API hosta
Dostępne przez `window.KMSMebleModule`:

- `getState()` — aktualny stan modułu,
- `getStage1Payload()` — dane do Etapu 1,
- `loadState(state)` — wczytanie stanu,
- `openCatalog("kitchen" | "storage")`,
- `clear()` — wyczyszczenie danych testowych.

## Dane do Etapu 1
Payload zawiera modele, ilości, wymiary, PCV, układ frontów, usługi wiercenia/składania oraz następny krok. Dla kuchni Etap 1 ma uzupełnić cokoły i blaty.

## Zasady chronione
- Korpus bazowy: 2 boki, wieniec dolny, trawers przedni i tylny.
- Model nr 2 pod zlew jest wyjątkiem.
- Kuchnia: front szerokość korpusu −4 mm, wysokość −7 mm.
- Szafy i szafki: front szerokość −4 mm, wysokość −4 mm.
- Przerwa między frontami: 4 mm.
- Brakującej reguły moduł nie może zgadywać.


## Dokument autorski

Moduł zawiera osobny dokument PDF:

`docs/INTELIGENTNA_SZAFA_25_LAT_DOSWIADCZENIA_LUKASZA_KULAKA.pdf`

Dokument jest dostępny z poziomu interfejsu i opisuje potencjał rozwiązania wynikającego z 25 lat doświadczenia, wiedzy i wyobraźni Łukasza Kułaka. Przy integracji należy zachować ścieżkę `docs/`, aby odnośnik w programie działał.
