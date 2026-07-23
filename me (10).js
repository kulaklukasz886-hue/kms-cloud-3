# KMS CLOUD 2.5.3 — PARSER + ADMIN FIX

Baza: KMS CLOUD 2.5.1 AUTH FIX + zachowany mechanizm STORAGE FIX.

## Zmiany

1. Parser proformy został przywrócony **1:1 z KMS CLOUD 2.4 STABLE**.
   - klient,
   - numer zlecenia,
   - pozycje,
   - materiały,
   - PCV,
   - dostawcy,
   - zadania produkcyjne.

2. Usuwanie zleceń:
   - przyciski są widoczne wyłącznie dla roli `ADMIN`,
   - funkcja jest zabezpieczona również w kodzie,
   - API `DELETE /api/orders` dopuszcza wyłącznie `ADMIN`,
   - wymagane jest podwójne potwierdzenie,
   - działa dla zleceń aktywnych i zrealizowanych.

3. Notatki przy zleceniu:
   - pracownicy mogą zapisywać i aktualizować notatkę,
   - pracownicy nie mogą usunąć istniejącej notatki ani zapisać pustej treści w jej miejsce,
   - przycisk „Usuń notatkę” jest widoczny wyłącznie dla `ADMIN`,
   - kontrola została dodana także w API, więc nie jest to wyłącznie blokada wizualna.

4. Pamięć lokalna:
   - duże pliki są przenoszone do IndexedDB,
   - `localStorage` przechowuje odchudzony stan,
   - na pulpicie pozostał przycisk „Napraw pamięć lokalną”.

## Publikacja

Wgraj do repozytorium całą zawartość folderu/ZIP, a następnie wykonaj redeploy na Vercel.
Nie podmieniaj wyłącznie `index.html`, ponieważ poprawka uprawnień notatek obejmuje również `api/orders.js`.
