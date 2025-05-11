# Dokument wymagań produktu (PRD) - 10x Cards
## 1. Przegląd produktu
10x Cards to aplikacja webowa umożliwiająca użytkownikom szybkie i efektywne tworzenie fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Aplikacja pozwala na automatyczne generowanie fiszek na podstawie wprowadzonego tekstu, a także manualne tworzenie, edytowanie i zarządzanie fiszkami. Głównym celem produktu jest przyspieszenie procesu tworzenia wysokiej jakości fiszek edukacyjnych i wspieranie efektywnego procesu nauki poprzez metodę spaced repetition.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca użytkowników do korzystania z efektywnej metody nauki jaką jest spaced repetition. Wielu uczniów, studentów i osób zainteresowanych efektywną nauką rezygnuje z korzystania z fiszek ze względu na czas potrzebny na ich przygotowanie, mimo że metoda ta jest naukowo udowodniona jako skuteczna technika nauki.

## 3. Wymagania funkcjonalne
1. Generowanie fiszek przez AI
   - System umożliwia generowanie fiszek przez AI na podstawie wprowadzonego tekstu
   - Użytkownicy mogą przeglądać, zatwierdzać lub odrzucać fiszki generowane przez AI
   - Aplikacja nie wymaga podawania dodatkowych wskazówek dla AI przed generowaniem fiszek

2. Manualne tworzenie fiszek
   - Użytkownicy mogą ręcznie tworzyć własne fiszki
   - System obsługuje tekstowe fiszki o strukturze: przód - tył

3. Zarządzanie fiszkami
   - Użytkownicy mogą przeglądać wszystkie swoje fiszki
   - Użytkownicy mogą edytować istniejące fiszki
   - Użytkownicy mogą usuwać fiszki

4. System kont użytkowników
   - Rejestracja i logowanie poprzez email i hasło
   - Weryfikacja adresu email
   - Przechowywanie fiszek w ramach konta użytkownika

5. System powtórek
   - Integracja z gotowym algorytmem spaced repetition
   - Interfejs sesji nauki z informacjami o postępie i statystykami

6. Analityka i monitorowanie
   - Śledzenie pochodzenia każdej fiszki (AI vs ręcznie)
   - Zbieranie danych dotyczących liczby wszystkich utworzonych fiszek
   - Informacja o statystykach dotyczacych fiszek (liczba wszystkich utworzonych fiszek, procent fiszek AI, procent fiszek stworzonych recznie przez uzytkownikow) 

## 4. Granice produktu
W zakres MVP nie wchodzą:
1. Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
2. Import wielu formatów (PDF, DOCX, itp.)
3. Współdzielenie zestawów fiszek między użytkownikami
4. Integracje z innymi platformami edukacyjnymi
5. Aplikacje mobilne (na początek tylko wersja web)
6. Edycja fiszek przed ich akceptacją (dotyczy fiszek generowanych przez AI)
7. Zaawansowane formatowanie fiszek (obrazy, dźwięki, filmy)

## 5. Historyjki użytkowników

### Rejestracja i logowanie

US-001: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę zarejestrować się w systemie, aby móc korzystać z aplikacji.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić adres email i hasło
  2. System weryfikuje poprawność formatu emaila i siłę hasła
  3. System wysyła email weryfikacyjny
  4. Po kliknięciu w link weryfikacyjny, konto zostaje aktywowane
  5. Użytkownik otrzymuje powiadomienie o pomyślnej rejestracji

US-002: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę zalogować się do systemu, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić swój email i hasło
  2. System weryfikuje poprawność danych
  3. Po poprawnej weryfikacji, użytkownik zostaje zalogowany i przekierowany do strony głównej
  4. W przypadku niepoprawnych danych, wyświetlany jest odpowiedni komunikat błędu

US-003: Resetowanie hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę zresetować swoje hasło, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
  1. Użytkownik może zażądać resetowania hasła podając swój email
  2. System wysyła email z linkiem do resetowania hasła
  3. Po kliknięciu w link, użytkownik może ustawić nowe hasło
  4. System potwierdza zmianę hasła

### Generowanie fiszek przez AI

US-004: Wprowadzanie tekstu do analizy
- Opis: Jako użytkownik, chcę wprowadzić tekst edukacyjny, aby AI mogło wygenerować fiszki.
- Kryteria akceptacji:
  1. Interfejs zawiera pole tekstowe umożliwiające wprowadzenie lub wklejenie tekstu
  2. Interfejs zawiera przycisk "Generuj fiszki"
  3. System informuje o maksymalnej dozwolonej długości tekstu
  4. System wyświetla komunikat o przetwarzaniu po kliknięciu przycisku generowania

US-005: Przeglądanie wygenerowanych fiszek
- Opis: Jako użytkownik, chcę przeglądać fiszki wygenerowane przez AI, aby ocenić ich jakość.
- Kryteria akceptacji:
  1. Po wygenerowaniu, system wyświetla listę fiszek
  2. Dla każdej fiszki widoczna jest zawartość przodu i tyłu
  3. Interfejs umożliwia nawigację między fiszkami
  4. System informuje o liczbie wygenerowanych fiszek

US-006: Zatwierdzanie lub odrzucanie fiszek AI
- Opis: Jako użytkownik, chcę zatwierdzać lub odrzucać poszczególne fiszki wygenerowane przez AI, aby zachować tylko te wysokiej jakości.
- Kryteria akceptacji:
  1. Przy każdej fiszce znajdują się przyciski "Zatwierdź" i "Odrzuć"
  2. Po zatwierdzeniu/odrzuceniu, system oznacza fiszkę odpowiednim statusem
  3. Użytkownik może zatwierdzić lub odrzucić wszystkie fiszki jednocześnie
  4. System zapisuje zatwierdzone fiszki w bazie danych użytkownika

### Manualne zarządzanie fiszkami

US-007: Ręczne tworzenie fiszki
- Opis: Jako użytkownik, chcę ręcznie utworzyć fiszkę, aby dodać treść, której AI nie wygenerowało lub która wymaga specyficznej formy.
- Kryteria akceptacji:
  1. Interfejs zawiera formularz z polami na przód i tył fiszki
  2. Użytkownik może zapisać fiszkę po wypełnieniu obu pól
  3. System waliduje, czy oba pola są wypełnione
  4. Po zapisaniu, fiszka pojawia się w kolekcji użytkownika

US-008: Przeglądanie kolekcji fiszek
- Opis: Jako użytkownik, chcę przeglądać swoją kolekcję fiszek, aby mieć przegląd dostępnych materiałów.
- Kryteria akceptacji:
  1. Interfejs wyświetla listę wszystkich fiszek użytkownika
  2. Fiszki można sortować według daty utworzenia lub ostatniej modyfikacji
  3. Interfejs umożliwia filtrowanie fiszek (np. według pochodzenia - AI vs ręczne)
  4. Dla każdej fiszki widoczna jest przynajmniej część zawartości przodu

US-009: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę edytować istniejącą fiszkę, aby poprawić jej treść.
- Kryteria akceptacji:
  1. Użytkownik może wybrać fiszkę do edycji z listy
  2. System wyświetla formularz z aktualnymi danymi fiszki
  3. Użytkownik może zmodyfikować zawartość przodu i tyłu
  4. Po zapisaniu zmian, system aktualizuje fiszkę w bazie danych

US-010: Usuwanie fiszki
- Opis: Jako użytkownik, chcę usunąć fiszkę, która nie jest mi już potrzebna.
- Kryteria akceptacji:
  1. Przy każdej fiszce znajduje się opcja usunięcia
  2. System prosi o potwierdzenie przed ostatecznym usunięciem
  3. Po usunięciu, fiszka znika z kolekcji użytkownika
  4. System wyświetla powiadomienie o pomyślnym usunięciu

### Nauka z wykorzystaniem fiszek

US-011: Rozpoczęcie sesji nauki
- Opis: Jako użytkownik, chcę rozpocząć sesję nauki, aby uczyć się z wykorzystaniem moich fiszek.
- Kryteria akceptacji:
  1. Interfejs zawiera przycisk "Rozpocznij naukę"
  2. Użytkownik może określić liczbę fiszek na sesję
  3. System wybiera fiszki zgodnie z algorytmem spaced repetition
  4. Sesja nauki rozpoczyna się od wyświetlenia pierwszej fiszki

US-012: Nauka z wykorzystaniem pojedynczej fiszki
- Opis: Jako użytkownik w trakcie sesji nauki, chcę zobaczyć przód fiszki, a następnie sprawdzić czy znam odpowiedź.
- Kryteria akceptacji:
  1. System najpierw pokazuje tylko przód fiszki
  2. Interfejs zawiera przycisk "Pokaż odpowiedź"
  3. Po kliknięciu przycisku, system pokazuje tył fiszki
  4. Interfejs umożliwia ocenę stopnia przyswojenia fiszki (np. "Umiem", "Nie umiem")

US-013: Zakończenie sesji nauki
- Opis: Jako użytkownik, chcę zakończyć sesję nauki i zobaczyć podsumowanie.
- Kryteria akceptacji:
  1. System informuje o zakończeniu sesji po przejściu przez wszystkie fiszki
  2. Użytkownik może przerwać sesję w dowolnym momencie
  3. System wyświetla podsumowanie sesji (np. liczba przerobiony fiszek, procent poprawnych odpowiedzi)
  4. Interfejs umożliwia powrót do głównego widoku

### Funkcje administratora

US-014: Przeglądanie statystyk systemu
- Opis: Jako administrator, chcę przeglądać kluczowe metryki systemu, aby monitorować jego skuteczność.
- Kryteria akceptacji:
  1. Dashboard z kluczowymi metrykami jest dostępny dla administratora
  2. Dashboard wyświetla liczbę fiszek AI vs ręcznych
  3. Dashboard pokazuje procent akceptacji fiszek AI
  4. Dashboard pokazuje dane na temat retencji uzytkownikow (pominiete na etapie MVP)
  5. Dashboard pokazuje dane na temat zaangazowania uzytkownikow (pominiete na etapie MVP)

## 6. Metryki sukcesu

1. Wskaźnik akceptacji AI
   - Opis: Procent fiszek wygenerowanych przez AI, które zostały zaakceptowane przez użytkowników.
   - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkowników.
   - Sposób pomiaru: Porównanie liczby zaakceptowanych fiszek AI do całkowitej liczby wygenerowanych fiszek AI.

2. Udział AI w tworzeniu fiszek
   - Opis: Procent wszystkich fiszek utworzonych z wykorzystaniem AI w stosunku do całkowitej liczby fiszek.
   - Cel: Użytkownicy tworzą 75% fiszek z wykorzystaniem AI.
   - Sposób pomiaru: Porównanie liczby wszystkich utworzonych fiszek (AI oraz ręcznie) z liczbą fiszek stworzonych przez AI.

3. Retencja użytkowników
   - Opis: Procent użytkowników, którzy wracają do aplikacji po pierwszym użyciu.
   - Cel: 50% nowych użytkowników wraca do aplikacji w ciągu tygodnia od rejestracji.
   - Sposób pomiaru: Śledzenie logowań użytkowników po ich pierwszym użyciu.

4. Zaangażowanie użytkowników
   - Opis: Częstotliwość korzystania z aplikacji przez aktywnych użytkowników.
   - Cel: Średnio 3 sesje nauki tygodniowo wśród aktywnych użytkowników.
   - Sposób pomiaru: Liczenie sesji nauki na użytkownika w ciągu tygodnia.
