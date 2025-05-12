# Kompleksowy Plan Testów dla Projektu 10x-cards

## 1. Wprowadzenie i cele testowania

### Cel dokumentu
Niniejszy plan testów definiuje strategię, podejście, zasoby i harmonogram działań testowych wymaganych do zapewnienia wysokiej jakości aplikacji 10x-cards. Dokument określa zakres testów, metodologie, zasoby, harmonogram oraz kryteria sukcesu dla procesu testowania.

### Cele testowania
- Weryfikacja, czy aplikacja spełnia wszystkie funkcjonalne i niefunkcjonalne wymagania
- Zapewnienie poprawnej integracji komponentów frontendowych (Astro, React) z backendem (Supabase)
- Gwarancja wysokiej wydajności i responsywności aplikacji
- Zapewnienie niezawodności systemu zarządzania fiszkami
- Weryfikacja poprawności implementacji funkcjonalności generowania fiszek przez AI
- Zapewnienie zgodności z najlepszymi praktykami dostępności (accessibility)
- Sprawdzenie poprawności działania aplikacji na różnych urządzeniach i przeglądarkach

## 2. Zakres testów

### Elementy objęte testami
1. **Komponenty frontendowe:**
   - Strony Astro (pages, layouts)
   - Komponenty React (interaktywne elementy UI)
   - Komponenty Shadcn/UI
   - Integracja z Tailwind CSS

2. **Funkcjonalności biznesowe:**
   - System zarządzania fiszkami (tworzenie, edycja, przeglądanie)
   - Generowanie fiszek z wykorzystaniem AI
   - Zarządzanie kolekcjami fiszek
   - Sesje nauki i statystyki postępu
   - System autentykacji i zarządzania profilem użytkownika

3. **Integracje:**
   - Integracja z Supabase (baza danych, autentykacja)
   - Integracja z API modelów językowych (OpenRouter.ai)
   - Middleware Astro

4. **Wydajność i skalowalność:**
   - Czas ładowania stron
   - Responsywność UI
   - Obsługa współbieżnych żądań `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`
   - Obsługa dużych zbiorów danych `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`

### Elementy wyłączone z testów
- Wewnętrzne elementy infrastruktury Supabase
- Testy penetracyjne bezpieczeństwa (wykonywane przez zewnętrzny zespół)
- Szczegółowe testy algorytmów modeli AI

## 3. Typy testów do przeprowadzenia

### Testy jednostkowe
- **Zakres:** Testowanie izolowanych komponentów UI, funkcji pomocniczych, walidatorów
- **Narzędzia:** Vitest, React Testing Library
- **Priorytety:**
  - Testy walidatorów Zod
  - Testy funkcji pomocniczych z `src/lib`
  - Testy komponentów React z `src/components`

### Testy integracyjne
- **Zakres:** Testowanie interakcji między komponentami, integracje z backendem
- **Narzędzia:** Vitest, MSW (Mock Service Worker)
- **Priorytety:**
  - Integracja formularzy z API
  - Komunikacja z Supabase
  - Przepływ danych między komponentami

### Testy e2e (end-to-end)
- **Zakres:** Testy całościowych ścieżek użytkownika
- **Narzędzia:** Playwright
- **Priorytety:**
  - Rejestracja i logowanie
  - Tworzenie i edycja fiszek
  - Generowanie fiszek przez AI
  - Przebieg sesji nauki
  - Zarządzanie kolekcjami

### Testy wydajnościowe
- **Zakres:** Testowanie wydajności aplikacji pod obciążeniem
- **Narzędzia:** Lighthouse, WebPageTest `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`, k6 `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`
- **Priorytety:**
  - Czas ładowania strony głównej
  - Wydajność generowania fiszek przez AI
  - Wydajność renderowania dużych kolekcji fiszek

### Testy dostępności (accessibility)
- **Zakres:** Zgodność z WCAG 2.1 AA
- **Narzędzia:** axe, Lighthouse
- **Priorytety:**
  - Dostępność komponentów interaktywnych
  - Kontrast kolorów
  - Obsługa czytników ekranu

### Testy responsywności
- **Zakres:** Poprawne wyświetlanie na różnych urządzeniach
- **Narzędzia:** Playwright (emulacja urządzeń), BrowserStack `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`
- **Priorytety:**
  - Układy na urządzeniach mobilnych
  - Responsywne komponenty UI
  - Poprawne działanie gestów dotykowych

### Testy kompatybilności
- **Zakres:** Testowanie na różnych przeglądarkach
- **Narzędzia:** Playwright, BrowserStack `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`
- **Priorytety:**
  - Wsparcie dla Chrome, Firefox, Safari, Edge
  - Poprawne działanie na systemach iOS i Android

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### Autentykacja użytkownika
1. **Rejestracja nowego użytkownika**
   - Rejestracja z poprawnymi danymi
   - Walidacja pól email i hasła
   - Obsługa błędów (np. zajęty email)

2. **Logowanie użytkownika**
   - Logowanie z poprawnymi danymi
   - Obsługa błędnych danych logowania
   - Resetowanie hasła

3. **Zarządzanie profilem**
   - Aktualizacja danych profilu
   - Zmiana avatara
   - Wylogowanie

### Zarządzanie fiszkami
1. **Tworzenie fiszek manualnie**
   - Tworzenie pojedynczej fiszki
   - Walidacja pól front/back
   - Zapisywanie i anulowanie

2. **Generowanie fiszek przez AI**
   - Generowanie fiszek z tekstu
   - Obsługa limitów (maxCards)
   - Obsługa błędów AI i timeoutów

3. **Edycja fiszek**
   - Edycja istniejącej fiszki (w tym fiszek AI *po* ich zatwierdzeniu)
   - Zatwierdzanie/odrzucanie fiszek wygenerowanych przez AI
   - Usuwanie fiszek

### Zarządzanie kolekcjami
1. **Tworzenie kolekcji**
   - Tworzenie nowej kolekcji
   - Dodawanie fiszek do kolekcji
   - Usuwanie fiszek z kolekcji

2. **Przeglądanie kolekcji**
   - Wyświetlanie listy kolekcji
   - Filtrowanie i sortowanie kolekcji
   - Szczegóły kolekcji

### Sesje nauki
1. **Rozpoczynanie sesji**
   - Tworzenie nowej sesji
   - Wybór liczby fiszek
   - Wybór kolekcji

2. **Przegląd fiszek w sesji**
   - Nawigacja między fiszkami
   - Oznaczanie odpowiedzi (poprawna/niepoprawna)
   - Zakończenie sesji

3. **Statystyki sesji**
   - Wyświetlanie wyników sesji
   - Śledzenie postępu
   - Statystyki historyczne

## 5. Środowisko testowe

### Środowiska
1. **Środowisko deweloperskie**
   - Lokalne środowisko deweloperów
   - Lokalny serwer Supabase
   - Konfiguracja: zmienne środowiskowe deweloperskie

2. **Środowisko testowe**
   - Dedykowany serwer CI/CD
   - Testowa instancja Supabase
   - Konfiguracja: zmienne środowiskowe testowe

3. **Środowisko produkcyjne (staging)**
   - Konfiguracja identyczna z produkcyjną
   - Izolowana baza danych
   - Pełna integracja z zewnętrznymi usługami

### Wymagania infrastrukturalne
- Serwery z Node.js 20+
- Dostęp do instancji Supabase
- Klucze API dla OpenRouter.ai
- Środowisko uruchomieniowe Docker
- System CI/CD (GitHub Actions)

## 6. Narzędzia do testowania

### Narzędzia do testów jednostkowych i integracyjnych
- **Vitest** - framework testowy kompatybilny z Astro i React
- **React Testing Library** - testowanie komponentów React
- **MSW (Mock Service Worker)** - mockowanie HTTP requestów

### Narzędzia do testów e2e
- **Playwright** - automatyzacja testów e2e
- **BrowserStack** - testowanie na rzeczywistych urządzeniach

### Narzędzia do testów wydajnościowych
- **Lighthouse** - analiza wydajności i dostępności
- **WebPageTest** - zaawansowana analiza wydajności
- **k6** - testy obciążeniowe API

### Narzędzia do testów dostępności
- **axe** - automatyzacja testów dostępności
- **Storybook** - izolowane testowanie komponentów UI `(Opcjonalnie dla MVP, jeśli pokrycie przez axe/Lighthouse jest wystarczające)`

### Narzędzia do zarządzania testami
- **GitHub Issues** - śledzenie błędów
- **GitHub Actions** - automatyzacja procesów CI/CD
- **Allure Report** - raportowanie wyników testów `(Poza zakresem MVP - do wdrożenia w późniejszym etapie)`

## 7. Harmonogram testów

### Faza 1: Przygotowanie
- Tydzień 1: Konfiguracja środowiska testowego
- Tydzień 1: Przygotowanie testów jednostkowych
- Tydzień 2: Implementacja podstawowych scenariuszy e2e

### Faza 2: Testy komponentów
- Tydzień 2-3: Testy jednostkowe komponentów UI
- Tydzień 3: Testy walidatorów i funkcji pomocniczych
- Tydzień 3-4: Testy integracyjne komponentów

### Faza 3: Testy funkcjonalne
- Tydzień 4-5: Testy e2e podstawowych ścieżek użytkownika
- Tydzień 5: Testy integracji z Supabase
- Tydzień 5-6: Testy generowania fiszek przez AI

### Faza 4: Testy niefunkcjonalne
- Tydzień 6: Testy wydajnościowe
- Tydzień 6-7: Testy dostępności
- Tydzień 7: Testy responsywności i kompatybilności

### Faza 5: Testy regresyjne i finalizacja
- Tydzień 8: Testy regresyjne
- Tydzień 8: Raportowanie i analiza wyników
- Tydzień 8: Finalizacja dokumentacji testowej

## 8. Kryteria akceptacji testów

### Kryteria ilościowe
- Pokrycie kodu testami jednostkowymi: min. 80%
- Wszystkie krytyczne ścieżki użytkownika pokryte testami e2e
- Zero błędów krytycznych i blokujących
- Maksymalnie 5 błędów o niskim priorytecie

### Kryteria jakościowe
- Zgodność z wymaganiami funkcjonalnymi
- Wynik Lighthouse dla wydajności: min. 90/100
- Wynik Lighthouse dla dostępności: min. 95/100
- Poprawne działanie na wszystkich głównych przeglądarkach

### Kryteria wydajnościowe
- Czas ładowania strony głównej: < 1.5s
- Czas odpowiedzi API: < 300ms (95 percentyl)
- Czas generowania fiszek: < 5s `(Zależne od zewnętrznego API - do monitorowania)`
- First Contentful Paint: < 1s

## 9. Role i odpowiedzialności w procesie testowania

### Zespół QA
- Projektowanie i implementacja testów
- Wykonanie testów manualnych
- Raportowanie i śledzenie błędów
- Weryfikacja poprawek

### Zespół deweloperski
- Implementacja testów jednostkowych
- Naprawianie zgłoszonych błędów
- Refaktoryzacja kodu na podstawie wyników testów
- Wsparcie w tworzeniu środowiska testowego

### Product Owner
- Priorytetyzacja błędów
- Weryfikacja zgodności z wymaganiami biznesowymi
- Akceptacja kryteriów testów
- Decyzje o wydaniu wersji

### DevOps
- Konfiguracja i utrzymanie środowisk testowych
- Konfiguracja pipeline'ów CI/CD
- Wsparcie w automatyzacji testów
- Monitoring wydajności

## 10. Procedury raportowania błędów

### Proces zgłaszania błędów
1. Identyfikacja błędu podczas testowania
2. Dokumentacja kroków reprodukcji
3. Kategoryzacja wg priorytetu i wagi
4. Przypisanie do odpowiedzialnej osoby
5. Śledzenie statusu w GitHub Issues

### Klasyfikacja błędów
- **Krytyczny:** Blokuje kluczowe funkcjonalności, wymaga natychmiastowej naprawy
- **Wysoki:** Istotnie wpływa na funkcjonalność, ale istnieją obejścia
- **Średni:** Wpływa na doświadczenie użytkownika, ale nie blokuje głównych funkcji
- **Niski:** Drobne problemy kosmetyczne, sugestie ulepszeń

### Raportowanie postępu
- Codzienny status testów (Daily Testing Report)
- Tygodniowy raport pokrycia testami
- Raport zbiorczy po każdej fazie testów
- Raport końcowy przed wydaniem wersji

### Zarządzanie ryzykiem
- Identyfikacja obszarów wysokiego ryzyka
- Plan mitygacji ryzyka
- Procedury eskalacji dla krytycznych problemów
- Strategie obejścia dla zidentyfikowanych problemów

## 11. Dokumentacja testowa

### Wymagana dokumentacja
- Plan testów (niniejszy dokument)
- Specyfikacje przypadków testowych
- Raporty z wykonania testów
- Raporty z błędów i ich rozwiązania
- Dokumentacja środowiska testowego

### Zarządzanie dokumentacją
- Przechowywanie w repozytorium GitHub
- System wersjonowania dokumentacji
- Regularne przeglądy i aktualizacje dokumentacji
- Dostępność dla wszystkich członków zespołu
