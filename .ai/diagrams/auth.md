# Diagram Przepływu Autentykacji - Moduł Autentykacji

<authentication_analysis>
## Analiza przepływów autentykacji na podstawie dokumentacji

### Przepływy autentykacji wymienione w dokumentacji
1. **Rejestracja użytkownika**:
   - Formularz rejestracyjny zbiera email i hasło
   - Walidacja poprawności danych po stronie klienta i serwera
   - Wywołanie `supabase.auth.signUp()` z przekazaniem emaila i hasła
   - Wysłanie emaila weryfikacyjnego
   - Przekierowanie na stronę informacyjną o weryfikacji
   - Obsługa linku weryfikacyjnego i aktywacja konta

2. **Logowanie użytkownika**:
   - Formularz logowania zbiera email i hasło
   - Walidacja poprawności danych
   - Wywołanie `supabase.auth.signInWithPassword()`
   - Ustawienie ciasteczek sesyjnych przez Supabase
   - Przekierowanie zalogowanego użytkownika do aplikacji

3. **Wylogowanie użytkownika**:
   - Kliknięcie przycisku wylogowania
   - Wywołanie `supabase.auth.signOut()`
   - Usunięcie ciasteczek sesyjnych
   - Przekierowanie na stronę główną

4. **Resetowanie hasła**:
   - Formularz zapomnienia hasła zbiera email
   - Wywołanie `supabase.auth.resetPasswordForEmail()`
   - Wysłanie emaila z linkiem do resetowania
   - Obsługa linku resetującego
   - Formularz ustawienia nowego hasła
   - Wywołanie `supabase.auth.updateUser({password: newPassword})`

5. **Weryfikacja sesji i kontrola dostępu**:
   - Middleware Astro sprawdza sesję użytkownika przy każdym żądaniu
   - Wywołanie `supabase.auth.getSession()`
   - Ustawienie `context.locals.user` na podstawie sesji
   - Kontrola dostępu do chronionych ścieżek
   - Przekierowanie niezalogowanych użytkowników

6. **Odświeżanie tokenu**:
   - Automatyczne odświeżanie tokenu przez Supabase Auth
   - Obsługa wygaśnięcia tokenu
   - Przekierowanie na stronę logowania w przypadku nieważnej sesji

### Główni aktorzy i ich interakcje
1. **Przeglądarka (Browser)** - Interfejs użytkownika
   - Renderuje formularze i strony
   - Przechowuje tokeny w ciasteczkach
   - Wykonuje żądania do API

2. **Middleware Astro** - Warstwa pośrednia
   - Weryfikuje stan sesji użytkownika
   - Zarządza dostępem do chronionych ścieżek
   - Przekierowuje użytkowników w zależności od stanu autentykacji

3. **Astro API** - Endpointy API
   - Obsługuje żądania autentykacji
   - Komunikuje się z Supabase Auth
   - Zwraca odpowiedzi do przeglądarki

4. **Supabase Auth** - Zewnętrzny serwis autentykacji
   - Zarządza użytkownikami
   - Generuje i weryfikuje tokeny
   - Wysyła emaile (weryfikacyjne, resetujące hasło)
   - Przechowuje dane użytkowników

### Procesy weryfikacji i odświeżania tokenów
1. **Weryfikacja tokenu**:
   - Tokeny JWT przechowywane w ciasteczkach HTTP-only
   - Middleware sprawdza ważność tokenu przy każdym żądaniu
   - W przypadku nieważnego tokenu, użytkownik jest wylogowywany

2. **Odświeżanie tokenu**:
   - Supabase automatycznie odświeża token dostępu
   - Wykorzystuje token odświeżania do generowania nowego tokenu dostępu
   - Aktualizuje ciasteczka sesyjne

### Opis kroków autentykacji
1. **Rejestracja**:
   - Użytkownik wypełnia formularz rejestracji
   - System waliduje dane wejściowe
   - Następuje wywołanie API rejestracji
   - Supabase tworzy nowego użytkownika
   - System wysyła email weryfikacyjny
   - Użytkownik jest przekierowywany na stronę informacyjną

2. **Weryfikacja email**:
   - Użytkownik klika w link weryfikacyjny w emailu
   - Przeglądarka otwiera stronę weryfikacji z tokenem w URL
   - Frontend wykrywa token i wywołuje Supabase Auth
   - Supabase weryfikuje token i aktywuje konto
   - Użytkownik jest automatycznie logowany

3. **Logowanie**:
   - Użytkownik wypełnia formularz logowania
   - System waliduje dane wejściowe
   - Następuje wywołanie API logowania
   - Supabase weryfikuje dane i tworzy sesję
   - Tokeny są zapisywane w ciasteczkach
   - Użytkownik jest przekierowywany do aplikacji

4. **Kontrola dostępu**:
   - Przy każdym żądaniu middleware sprawdza sesję
   - Jeśli użytkownik jest zalogowany, ma dostęp do chronionych ścieżek
   - Jeśli nie jest zalogowany, jest przekierowywany do logowania
   - Jeśli jest zalogowany i próbuje dostać się do stron autentykacji, jest przekierowywany do aplikacji

5. **Wylogowanie**:
   - Użytkownik klika przycisk wylogowania
   - Następuje wywołanie API wylogowania
   - Supabase kończy sesję i usuwa tokeny
   - Użytkownik jest przekierowywany na stronę główną
</authentication_analysis>

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    
    participant Przeglądarka as Przeglądarka
    participant Middleware as Astro Middleware
    participant API as Astro API
    participant Auth as Supabase Auth
    
    Note over Przeglądarka,Auth: Proces Rejestracji
    
    Przeglądarka->>Przeglądarka: Wypełnienie formularza rejestracji
    Przeglądarka->>API: POST /api/auth/register {email, password}
    activate API
    API->>API: Walidacja danych wejściowych
    
    alt Dane niepoprawne
        API-->>Przeglądarka: 400 Bad Request {error}
    else Dane poprawne
        API->>Auth: supabase.auth.signUp()
        activate Auth
        Auth->>Auth: Utworzenie użytkownika
        Auth->>Auth: Wygenerowanie tokenu weryfikacyjnego
        Auth-->>API: Sukces {user, session}
        deactivate Auth
        
        API-->>Przeglądarka: 201 Created {success}
        deactivate API
        
        Auth->>Przeglądarka: Wysłanie emaila weryfikacyjnego
        Przeglądarka->>Przeglądarka: Przekierowanie na /verify-email
    end
    
    Note over Przeglądarka,Auth: Proces Weryfikacji Email
    
    Przeglądarka->>Przeglądarka: Kliknięcie linku w emailu
    Przeglądarka->>Przeglądarka: Otwarcie /verify-email?token=xyz
    
    Przeglądarka->>Auth: supabase.auth.onAuthStateChange()
    activate Auth
    Auth->>Auth: Weryfikacja tokenu
    Auth-->>Przeglądarka: Event SIGNED_IN {session}
    deactivate Auth
    
    Przeglądarka->>Przeglądarka: Zapisanie tokenu w ciasteczkach
    Przeglądarka->>Przeglądarka: Przekierowanie do aplikacji
    
    Note over Przeglądarka,Auth: Proces Logowania
    
    Przeglądarka->>Przeglądarka: Wypełnienie formularza logowania
    Przeglądarka->>API: POST /api/auth/login {email, password}
    activate API
    API->>API: Walidacja danych wejściowych
    
    alt Dane niepoprawne
        API-->>Przeglądarka: 400 Bad Request {error}
    else Dane poprawne
        API->>Auth: supabase.auth.signInWithPassword()
        activate Auth
        Auth->>Auth: Weryfikacja danych
        
        alt Autentykacja udana
            Auth-->>API: Sukces {user, session}
            Auth-->>Przeglądarka: Ustawienie ciasteczek sesyjnych
            API-->>Przeglądarka: 200 OK {user, session}
            deactivate API
            deactivate Auth
            Przeglądarka->>Przeglądarka: Przekierowanie do aplikacji
        else Autentykacja nieudana
            Auth-->>API: Błąd {error}
            deactivate Auth
            API-->>Przeglądarka: 401 Unauthorized {error}
            deactivate API
        end
    end
    
    Note over Przeglądarka,Auth: Kontrola Dostępu (Middleware)
    
    Przeglądarka->>Middleware: Żądanie chronionej ścieżki
    activate Middleware
    Middleware->>Auth: supabase.auth.getSession()
    activate Auth
    Auth-->>Middleware: {session, user}
    deactivate Auth
    
    alt Sesja ważna
        Middleware->>Middleware: context.locals.user = user
        Middleware-->>Przeglądarka: Dostęp do zasobu
        deactivate Middleware
    else Brak sesji/Sesja nieważna
        Middleware-->>Przeglądarka: Przekierowanie do /login
        deactivate Middleware
    end
    
    Note over Przeglądarka,Auth: Odświeżanie Tokenów
    
    Przeglądarka->>Middleware: Żądanie z tokenem dostępu
    activate Middleware
    
    alt Token ważny
        Middleware-->>Przeglądarka: Normalna odpowiedź
    else Token wygasł
        Middleware->>Auth: supabase.auth.getSession()
        activate Auth
        Auth->>Auth: Wykrycie wygasłego tokenu dostępu
        
        alt Token odświeżania ważny
            Auth->>Auth: Wygenerowanie nowego tokenu dostępu
            Auth-->>Middleware: Nowa sesja {session}
            Auth-->>Przeglądarka: Aktualizacja ciasteczek sesyjnych
            deactivate Auth
            Middleware-->>Przeglądarka: Normalna odpowiedź
        else Token odświeżania wygasł
            Auth-->>Middleware: Błąd sesji
            deactivate Auth
            Middleware-->>Przeglądarka: Przekierowanie do /login
        end
    end
    deactivate Middleware
    
    Note over Przeglądarka,Auth: Proces Wylogowania
    
    Przeglądarka->>API: POST /api/auth/logout
    activate API
    API->>Auth: supabase.auth.signOut()
    activate Auth
    Auth->>Auth: Anulowanie sesji
    Auth-->>API: Sukces
    Auth-->>Przeglądarka: Usunięcie ciasteczek sesyjnych
    deactivate Auth
    API-->>Przeglądarka: 200 OK
    deactivate API
    Przeglądarka->>Przeglądarka: Przekierowanie na stronę główną
    
    Note over Przeglądarka,Auth: Proces Resetowania Hasła
    
    Przeglądarka->>Przeglądarka: Wypełnienie formularza zapomnienia hasła
    Przeglądarka->>API: POST /api/auth/forgot-password {email}
    activate API
    API->>Auth: supabase.auth.resetPasswordForEmail()
    activate Auth
    Auth->>Auth: Wygenerowanie tokenu resetującego
    Auth-->>API: Sukces
    deactivate Auth
    API-->>Przeglądarka: 200 OK
    deactivate API
    
    Auth->>Przeglądarka: Wysłanie emaila z linkiem resetującym
    Przeglądarka->>Przeglądarka: Kliknięcie linku resetującego
    Przeglądarka->>Przeglądarka: Otwarcie /reset-password?token=xyz
    
    Przeglądarka->>Auth: supabase.auth.onAuthStateChange()
    activate Auth
    Auth->>Auth: Wykrycie eventu PASSWORD_RECOVERY
    Auth-->>Przeglądarka: Event PASSWORD_RECOVERY {token}
    deactivate Auth
    
    Przeglądarka->>Przeglądarka: Wyświetlenie formularza nowego hasła
    Przeglądarka->>Przeglądarka: Wprowadzenie nowego hasła
    
    Przeglądarka->>Auth: supabase.auth.updateUser({password})
    activate Auth
    Auth->>Auth: Aktualizacja hasła
    Auth-->>Przeglądarka: Sukces {user}
    deactivate Auth
    
    Przeglądarka->>Przeglądarka: Przekierowanie do /login
```
</mermaid_diagram> 