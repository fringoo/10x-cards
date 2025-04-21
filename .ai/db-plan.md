# Schemat bazy danych PostgreSQL dla 10x Cards

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### 1.1. Tabela: profiles
- **id**: UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE  
- **full_name**: TEXT  
- **avatar_url**: TEXT  
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### 1.2. Tabela: flashcards
- **id**: UUID PRIMARY KEY DEFAULT uuid_generate_v4()  
- **user_id**: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE  
- **front**: TEXT NOT NULL            — zawartość fiszki (przód)  
- **back**: TEXT NOT NULL             — zawartość fiszki (tył)  
- **source**: TEXT NOT NULL CHECK (source IN ('ai', 'manual'))  
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

### 1.3. Tabela: sessions
- **id**: UUID PRIMARY KEY DEFAULT uuid_generate_v4()  
- **user_id**: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE  
- **started_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
- **ended_at**: TIMESTAMP WITH TIME ZONE NULL  
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  
// (opcjonalnie: dodatkowe kolumny statystyczne lub status sesji)

### 1.4. Tabela: session_flashcards
Tabela pomocnicza dla relacji wiele-do-wielu między sesjami nauki a fiszkami.
- **session_id**: UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE  
- **flashcard_id**: UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE  
- **status**: TEXT CHECK (status IN ('correct','incorrect')) NULL            — wynik oceny fiszki  
- **reviewed_at**: TIMESTAMP WITH TIME ZONE NULL  
- PRIMARY KEY (session_id, flashcard_id)

## 2. Relacje między tabelami
- Relacja 1:N między `auth.users` a `flashcards` – każdy użytkownik może mieć wiele fiszek.
- Relacja 1:N między `auth.users` a `sessions` – każdy użytkownik może mieć wiele sesji nauki.
- Relacja wiele-do-wielu między `sessions` i `flashcards` realizowana przez tabelę `session_flashcards`.
- Relacja 1:1 między `auth.users` a `profiles` - informacje profilowe dla każdego użytkownika.

## 3. Indeksy
- Indeks na kolumnie `user_id` w tabelach:
  - `flashcards`:  
    `CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);`
  - `sessions`:  
    `CREATE INDEX idx_sessions_user_id ON sessions(user_id);`
- Indeks na kolumnę `source` w tabeli `flashcards` dla częstszych zapytań filtrowanych według źródła:  
  `CREATE INDEX idx_flashcards_source ON flashcards(source);`
- Indeks na kolumnę `reviewed_at` w tabeli `session_flashcards`:  
  `CREATE INDEX idx_session_flashcards_reviewed_at ON session_flashcards(reviewed_at);`

## 4. Zasady PostgreSQL (Row Level Security - RLS)
Wdrożenie RLS umożliwia dostęp do danych tylko właścicielom (oraz administratorom do zagregowanych statystyk). Przykładowa konfiguracja:

```sql
-- Włączenie RLS dla tabel
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_flashcards ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca użytkownikowi zobaczyć tylko własne fiszki
CREATE POLICY "authenticated can select own flashcards" ON flashcards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Polityka pozwalająca użytkownikowi zobaczyć tylko własne sesje
CREATE POLICY "authenticated can select own sessions" ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Polityka pozwalająca użytkownikowi zobaczyć tylko własny profil
CREATE POLICY "authenticated can select own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

## 5. Automatyczne aktualizowanie kolumny updated_at
Dla wszystkich tabel z kolumną `updated_at` zastosowano funkcję wyzwalacza:

```sql
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_flashcards_updated
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();

CREATE TRIGGER trig_sessions_updated
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();

CREATE TRIGGER trig_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();
```

## 6. Dodatkowe wyjaśnienia dotyczące decyzji projektowych
- Schemat został zaprojektowany zgodnie z ustaleniami MVP: integracja z Supabase Auth, model użytkownika rozszerzony przez tabelę profiles, zatwierdzone fiszki z kolumną `source` oraz oddzielenie historii sesji nauki od tabeli fiszek.
- Relacje 1:N między użytkownikami a fiszkami oraz użytkownikami a sesjami zapewniają integralność danych, zaś tabela `session_flashcards` umożliwia szczegółowe monitorowanie postępów nauki.
- Indeksy zostały uwzględnione, aby poprawić wydajność zapytań w miarę zwiększania się danych.
- Mechanizm RLS zabezpiecza dane, umożliwiając wyświetlanie tylko rekordów, do których użytkownik ma uprawnienia.
- Schemat jest zoptymalizowany pod kątem technologii używanych w projekcie (PostgreSQL w ramach Supabase, Astro, TypeScript) przy zachowaniu prostoty i skalowalności.

```sql
CREATE FUNCTION set_timestamp()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_flashcards_updated
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();

CREATE TRIGGER trig_sessions_updated
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();

CREATE TRIGGER trig_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp();
```

CREATE TYPE flashcard_source AS ENUM ('ai','manual');
… source flashcard_source NOT NULL …

CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- analogiczne polityki RLS jak dla flashcards/sessions
