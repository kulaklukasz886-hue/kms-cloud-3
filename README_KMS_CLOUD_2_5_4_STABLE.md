# KMS CLOUD 2.5.4 STABLE — DOSTAWCY + KOMUNIKACJA

Wersja przygotowana na bazie produkcyjnej **2.5.3**.

## Wprowadzone poprawki

1. Generator dostawców pobiera tylko pozycje ze statusem **Do zamówienia**.
2. Zlecenia, w których produkcja już ruszyła, są pomijane w nowym zamówieniu.
3. Przed finalnym zamówieniem pojawia się robocza weryfikacja Ewy:
   - Mamy na hali,
   - ilość dostępna na hali,
   - korekta ilości do zamówienia,
   - uwaga,
   - odświeżenie listy,
   - dopiero potem zatwierdzenie.
4. Historia korekt jest zapisywana przy materiale.
5. Dostawca może być przypisany do dokładnego materiału; zmianę wykonuje administrator.
6. Nowa wiadomość Hala–Biuro zmienia napis modułu w bocznym panelu na czerwony. Po otwarciu modułu powiadomienie znika dla danego użytkownika.
7. Zamówienie źródłowe klienta jest obowiązkowe i dostępne operatorom. Obsługiwane formaty: PDF, zdjęcia, XLSX, XLS i CSV.
8. Dodatkowe zdjęcia pozostają opcjonalne i są automatycznie optymalizowane.
9. Pliki zlecenia nie są już dublowane w rekordzie zlecenia i tabeli plików — dokument jest przesyłany i przechowywany w jednym miejscu danych plikowych.

## Wdrożenie

Wgraj **zawartość tego folderu** do repozytorium GitHub, nie sam plik ZIP.

Przed publikacją produkcyjną wykonaj test:
- zamówienie z pozycją Do zamówienia,
- zamówienie po rozpoczęciu produkcji,
- pełne i częściowe pokrycie materiału z hali,
- korekta ilości,
- przypisanie innego dostawcy niż JUAN,
- nowa wiadomość hala → biuro i biuro → hala,
- zlecenie z plikiem XLSX jako dokumentem klienta.
