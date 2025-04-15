# Schemat bazy danych PostgreSQL dla 10x Cards

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### 1.1. Tabela: users
- **id**: SERIAL PRIMARY KEY  
- **email**: TEXT NOT NULL UNIQUE  
- **hashed_password**: TEXT NOT NULL  
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### 1.2. Tabela: flashcards
- **id**: SERIAL PRIMARY KEY  
- **user_id**: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE  
- **front**: TEXT NOT NULL            — zawartość fiszki (przód)  
- **back**: TEXT NOT NULL             — zawartość fiszki (tył)  
- **source**: TEXT NOT NULL CHECK (source IN ('AI', 'manual'))  
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### 1.3. Tabela: sessions
- **id**: SERIAL PRIMARY KEY  
- **user_id**: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE  
- **started_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **ended_at**: TIMESTAMP WITH TIME ZONE NULL  
// (opcjonalnie: dodatkowe kolumny statystyczne lub status sesji)

### 1.4. Tabela: session_flashcards
Tabela pomocnicza dla relacji wiele-do-wielu między sesjami nauki a fiszkami.
- **session_id**: INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE  
- **flashcard_id**: INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE  
- **status**: TEXT NULL            — np. wynik oceny fiszki (poprawnie/niepoprawnie)  
- **reviewed_at**: TIMESTAMP WITH TIME ZONE NULL  
- PRIMARY KEY (session_id, flashcard_id)

## 2. Relacje między tabelami
- Relacja 1:N między `users` a `flashcards` – każdy użytkownik może mieć wiele fiszek.
- Relacja 1:N między `users` a `sessions` – każdy użytkownik może mieć wiele sesji nauki.
- Relacja wiele-do-wielu między `sessions` i `flashcards` realizowana przez tabelę `session_flashcards`.

## 3. Indeksy
- Unikalny indeks na kolumnie `email` w tabeli `users` (implicitny przez UNIQUE).  
- Indeks na kolumnie `user_id` w tabelach:
  - `flashcards`:  
    `CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);`
  - `sessions`:  
    `CREATE INDEX idx_sessions_user_id ON sessions(user_id);`
- Opcjonalnie, indeks na kolumnę `source` w tabeli `flashcards` dla częstszych zapytań filtrowanych według źródła:  
  `CREATE INDEX idx_flashcards_source ON flashcards(source);`

## 4. Zasady PostgreSQL (Row Level Security - RLS)
Wdrożenie RLS umożliwia dostęp do danych tylko właścicielom (oraz administratorom do zagregowanych statystyk). Przykładowa konfiguracja:

```sql
-- Włączenie RLS dla tabel
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca użytkownikowi zobaczyć tylko własne fiszki
CREATE POLICY user_flashcards_policy ON flashcards
    USING (user_id = current_setting('app.current_user_id')::integer);

-- Polityka pozwalająca użytkownikowi zobaczyć tylko własne sesje
CREATE POLICY user_sessions_policy ON sessions
    USING (user_id = current_setting('app.current_user_id')::integer);

-- Przykładowe polityki dla administratorów (dostęp do zagregowanych statystyk)
CREATE POLICY admin_flashcards_policy ON flashcards
    FOR SELECT
    USING (current_setting('app.user_role', true) = 'admin');

CREATE POLICY admin_sessions_policy ON sessions
    FOR SELECT
    USING (current_setting('app.user_role', true) = 'admin');
```

(Uwaga: Kluczem do wdrożenia RLS jest odpowiednia konfiguracja ustawień kontekstu aplikacji, np. `app.current_user_id` oraz `app.user_role`).

## 5. Dodatkowe wyjaśnienia dotyczące decyzji projektowych
- Schemat został zaprojektowany zgodnie z ustaleniami MVP: prosty model użytkownika, zatwierdzone fiszki z kolumną `source` oraz oddzielenie historii sesji nauki od tabeli fiszek.
- Relacje 1:N między użytkownikami a fiszkami oraz użytkownikami a sesjami zapewniają integralność danych, zaś tabela `session_flashcards` umożliwia szczegółowe monitorowanie postępów nauki.
- Indeksy zostały uwzględnione, aby poprawić wydajność zapytań w miarę zwiększania się danych.
- Mechanizm RLS zabezpiecza dane, umożliwiając wyświetlanie tylko rekordów, do których użytkownik ma uprawnienia, a administratorom dostęp do zagregowanych statystyk bez możliwości przeglądania szczegółowych danych.
- Schemat jest zoptymalizowany pod kątem technologii używanych w projekcie (PostgreSQL w ramach Supabase, Astro, TypeScript) przy zachowaniu prostoty i skalowalności.
