{
  "id": "MEBLE_KMS",
  "name": "Meble KMS — Inteligentna Szafa",
  "version": "0.2.0-integrated-test",
  "status": "TEST_ONLY",
  "entry": "index.html",
  "storage_key": "kms_module_meble_test_010",
  "catalogs": [
    "Meble kuchenne",
    "Szafy i szafki"
  ],
  "features": [
    "szybki wybór modeli i ilości",
    "wymiary standardowe z odblokowaniem wyjątków",
    "inteligentna szafka",
    "podział frontu poziomy i pionowy",
    "blokowanie wymiaru frontu",
    "przekazanie danych do Etapu 1",
    "wybór wiercenia i składania",
    "logo i identyfikacja Inteligentna Szafa",
    "dokument autorski dostępny bezpośrednio z programu",
    "rozbicie modeli na pozycje Etapu 1",
    "integracja z KMS TEST 2.8.0",
    "materiały pozostają zablokowane do wyboru z Katalogu KMS"
  ],
  "host_events": {
    "ready": "kms:meble:ready",
    "state_changed": "kms:meble:state-changed",
    "stage1_ready": "kms:meble:stage1-ready"
  },
  "global_api": "window.KMSMebleModule",
  "author": {
    "name": "Łukasz Kułak",
    "basis": "25 lat doświadczenia zawodowego, wiedzy praktycznej i wyobraźni"
  },
  "documents": [
    {
      "id": "inteligentna-szafa-25-lat",
      "title": "Inteligentna Szafa - 25 lat doświadczenia Łukasza Kułaka",
      "path": "docs/INTELIGENTNA_SZAFA_25_LAT_DOSWIADCZENIA_LUKASZA_KULAKA.pdf",
      "type": "application/pdf",
      "visibility": "module"
    }
  ]
}