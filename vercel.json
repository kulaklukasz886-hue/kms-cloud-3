KMS CLOUD 2.5 AUTH

KOLEJNOŚĆ WDROŻENIA:
1. Supabase SQL Editor: uruchom sql/kms_cloud_2_5_auth.sql
2. Supabase Authentication > Users: utwórz konta e-mail/hasło.
3. Table Editor > profiles: ustaw full_name i role. Pierwsze konto ustaw jako ADMIN.
4. Vercel Environment Variables: zalecane dodać SUPABASE_SERVICE_ROLE_KEY (tylko po stronie serwera).
5. GitHub: podmień cały index.html i cały folder api.
6. Vercel: poczekaj na Ready.
7. Otwórz KMS i zaloguj się.

ROLE:
ADMIN, BIURO, KOORDYNACJA, PILA, OKLEINIARKA, CNC, MONTAZ, PRODUKCJA.

STAŁA ZASADA:
Moduł ODPADY jest dostępny dla każdej roli.

BEZPIECZEŃSTWO:
- endpointy API wymagają ważnej sesji Supabase;
- usuwanie zlecenia tylko ADMIN;
- tworzenie zlecenia i klienci tylko ADMIN/BIURO;
- każda ważna operacja zapisuje audit log;
- wybór roli z przeglądarki został usunięty.
