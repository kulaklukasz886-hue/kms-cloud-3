KMS TESTOWY 2.7.1 — CSV KANONICZNY DLA KONWERTERA

Generator CSV został dopasowany 1:1 do pliku:
138_FABIANSKI_U999_ST7(1).csv

Wymagany zapis:
- brak wiersza nagłówków,
- dokładnie 17 pól w każdym wierszu,
- separator średnik (;),
- zakończenie wierszy CRLF,
- UTF-8 bez BOM,
- obrzeża: dokładnie 1mm albo 2mm,
- pole 2 zawsze puste,
- pole 9 zawsze 0,
- pole 10 = OBROTOWO 0/1,
- pola 15–17 zawsze puste.

Układ:
1 INFO
2 puste
3 numer elementu
4 materiał
5 długość
6 szerokość
7 ilość
8 grubość
9 0
10 obrotowo
11–14 oklejanie
15–17 puste

INFO:
- STANDARD / 10MM / 16MM: puste
- 28MM: 28MM
- 36MM: 36MM
- element zbiorczy i inne jawne technologie: krótka informacja technologiczna

Podmień:
- główny index.html

Plik api/analyze-order.js jest dołączony wyłącznie dla kompletności paczki i nie wymaga zmiany względem 2.7.0.
