<conversation_summary>
<decisions>
1. Model użytkownika zostanie oparty na podstawowym zestawie pól: id, email, hashed_password, created_at, updated_at (bez dodatkowych atrybutów jak imię, nazwisko, rola, status weryfikacji).
2. Tabela flashcards będzie przechowywać tylko zatwierdzone fiszki (zarówno generowane przez AI, jak i wprowadzone ręcznie) z dodatkową kolumną "source" wskazującą pochodzenie (AI lub manual).
3. Historia sesji nauki zostanie oddzielona od tabeli flashcards poprzez utworzenie osobnej tabeli sesji oraz znormalizowanej tabeli pomocniczej (np. session_flashcards) według zasad 2NF lub 3NF.
4. Zastosowane będą relacje 1:N między użytkownikami a flashcards oraz między użytkownikami a sesjami nauki, z ograniczeniem dostępu do danych tylko dla właściciela.
5. Mechanizm RLS zostanie skonfigurowany tak, aby użytkownik miał dostęp tylko do swoich danych, natomiast administratorzy uzyskają dostęp jedynie do zagregowanych statystyk bez możliwości przeglądania szczegółowych danych.
6. W MVP zastosujemy proste typy danych (serial/integer dla identyfikatorów, text dla treści, timestamp dla dat) oraz podstawowe ograniczenia (NOT NULL, UNIQUE, ewentualne CHECK dla "source").
</decisions>

<matched_recommendations>
1. Użycie podstawowego modelu użytkownika z niezbędnymi polami.
2. Utworzenie tabeli flashcards z dodatkową kolumną "source" dla statystyk.
3. Rozdzielenie historii sesji nauki od flashcards przez stworzenie oddzielnych tabel (sesje i session_flashcards) zgodnie z zasadami normalizacji.
4. Definicja relacji 1:N między użytkownikami a flashcards oraz między użytkownikami a sesjami nauki.
5. Implementacja RLS ograniczającego dostęp do danych do właściciela, a dla administratorów dostęp tylko do zagregowanych statystyk.
6. Stosowanie prostych i funkcjonalnych typów danych oraz ograniczeń zgodnie z wymaganiami MVP.
</matched_recommendations>

<database_planning_summary>
Główne wymagania schematu bazy danych obejmują utworzenie trzech kluczowych encji: użytkownicy, flashcards oraz sesje nauki (wraz z tabelą pomocniczą łączącą flashcards z sesjami). Użytkownik posiada jedynie podstawowy zestaw pól, a flashcards przechowują informację o źródle, umożliwiającą późniejsze liczenie statystyk. Relacje między tymi encjami są definiowane jako 1:N, co zapewnia, że każdy użytkownik ma swoje fiszki i sesje. Bezpieczeństwo danych będzie wdrożone na poziomie wierszy (RLS) umożliwiając, aby użytkownicy mieli dostęp wyłącznie do swoich danych, a rola administratora miała jedynie dostęp do statystyk. Schemat korzystać będzie z prostych typów danych i ograniczeń, aby spełnić wymagania MVP bez komplikacji wynikających z dalszej skalowalności czy optymalizacji.
</database_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii – wszystkie kluczowe decyzje i zalecenia zostały uzgodnione w ramach MVP.
</unresolved_issues>
</conversation_summary>
