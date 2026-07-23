KMS CLOUD 2.5.1 AUTH FIX

NAPRAWA:
- dodano brakującą funkcję loginKms();
- dodano inicjalizację Supabase Auth;
- dodano odczyt profilu i roli z /api/me;
- dodano obsługę sesji i wylogowania;
- dodano filtrowanie modułów według ról;
- moduł ODPADY pozostaje dostępny dla wszystkich ról.

WDROŻENIE:
1. W GitHub podmień tylko index.html z tej paczki.
2. Folder api z wersji 2.5 AUTH pozostaje bez zmian.
3. Poczekaj na Vercel Ready.
4. Otwórz KMS i wykonaj Ctrl+F5.
5. Zaloguj się adresem i hasłem utworzonym w Supabase Authentication.

JEŻELI POJAWI SIĘ BŁĄD:
- „Brak SUPABASE_URL lub klucza publicznego”:
  sprawdź zmienne SUPABASE_URL i SUPABASE_ANON_KEY w Vercel i wykonaj Redeploy.
- „Brak profilu użytkownika”:
  sprawdź rekord w tabeli public.profiles.
- „Konto nieaktywne”:
  ustaw active = TRUE.
