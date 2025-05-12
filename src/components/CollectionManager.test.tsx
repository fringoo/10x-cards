import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollectionManager from "./CollectionManager";
import type { CollectionBasicInfo, FlashcardDetailsDTO } from "@/lib/services/collection.service";
import React from "react";

// Mockowanie komponentów UI z shadcn
vi.mock("@/components/ui/select", () => {
  return {
    Select: ({ children, value, onValueChange }: any) => (
      <div data-testid="select">
        <button data-testid="select-value" onClick={() => {}}>
          {value || "Wybierz kolekcję..."}
        </button>
        <button data-testid="select-col1" onClick={() => onValueChange && onValueChange("col1")}>
          Kolekcja 1
        </button>
        <button data-testid="select-col2" onClick={() => onValueChange && onValueChange("col2")}>
          Kolekcja 2
        </button>
      </div>
    ),
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => <div data-value={value}>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
  };
});

// Mockowane dane testowe
const mockCollections: CollectionBasicInfo[] = [
  { id: "col1", name: "Kolekcja 1" },
  { id: "col2", name: "Kolekcja 2" },
];

const mockFlashcards: FlashcardDetailsDTO[] = [
  {
    id: "card1",
    front: "Przód fiszki 1",
    back: "Tył fiszki 1",
    collection_id: "col1",
    user_id: "user123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: "user",
    ai_approval_status: "",
    ai_modified_by_user: false,
  },
  {
    id: "card2",
    front: "Przód fiszki 2",
    back: "Tył fiszki 2",
    collection_id: "col1",
    user_id: "user123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: "ai",
    ai_approval_status: "pending",
    ai_modified_by_user: false,
  },
];

// Mockowanie globalnego fetch
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

describe("CollectionManager", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pobiera i wyświetla kolekcje użytkownika", async () => {
    // Arrange - konfiguracja mocka fetch dla kolekcji
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCollections,
    });

    // Act - renderowanie komponentu
    render(<CollectionManager />);

    // Assert - sprawdzamy czy komponent pokazuje ładowanie kolekcji
    expect(screen.getByText("Ładowanie kolekcji...")).toBeInTheDocument();

    // Czekamy aż kolekcje zostaną załadowane
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/collections");
    });

    // Sprawdzamy czy select jest dostępny po załadowaniu kolekcji
    const select = await screen.findByTestId("select");
    expect(select).toBeInTheDocument();

    // Sprawdzamy czy opcje kolekcji są dostępne
    const col1Button = screen.getByTestId("select-col1");
    const col2Button = screen.getByTestId("select-col2");
    expect(col1Button).toHaveTextContent("Kolekcja 1");
    expect(col2Button).toHaveTextContent("Kolekcja 2");
  });

  it("wyświetla komunikat o błędzie, gdy nie udało się pobrać kolekcji", async () => {
    // Arrange - konfiguracja mocka fetch dla błędu
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Błąd serwera",
      json: async () => ({ message: "Błąd serwera" }),
    });

    // Act - renderowanie komponentu
    render(<CollectionManager />);

    // Assert - sprawdzamy czy komunikat o błędzie jest wyświetlany
    await waitFor(() => {
      expect(screen.getByText("Błąd")).toBeInTheDocument();
      expect(screen.getByText("Błąd serwera")).toBeInTheDocument();
    });
  });

  it("pobiera i wyświetla fiszki po wybraniu kolekcji", async () => {
    // Arrange - konfiguracja mocków fetch dla kolekcji i fiszek
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlashcards,
      });

    // Act - renderowanie komponentu
    render(<CollectionManager />);

    // Czekamy aż kolekcje zostaną załadowane
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/collections");
    });

    // Wybieramy kolekcję klikając na przycisk
    const col1Button = await screen.findByTestId("select-col1");
    fireEvent.click(col1Button);

    // Assert - sprawdzamy czy komponent wysłał zapytanie o fiszki
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/collections/col1/flashcards");
    });

    // Sprawdzamy czy fiszki są wyświetlane
    await waitFor(() => {
      expect(screen.getByText("Przód fiszki 1")).toBeInTheDocument();
      expect(screen.getByText("Przód fiszki 2")).toBeInTheDocument();
    });

    // Sprawdzamy czy badge AI jest wyświetlany dla drugiej fiszki
    const aiBadge = await screen.findByText("AI: pending");
    expect(aiBadge).toBeInTheDocument();
  });

  it("wyświetla komunikat, gdy kolekcja nie zawiera fiszek", async () => {
    // Arrange - konfiguracja mocków fetch dla kolekcji i pustej listy fiszek
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    // Act - renderowanie komponentu
    render(<CollectionManager />);

    // Czekamy aż kolekcje zostaną załadowane
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/collections");
    });

    // Wybieramy kolekcję klikając na przycisk
    const col1Button = await screen.findByTestId("select-col1");
    fireEvent.click(col1Button);

    // Assert - sprawdzamy czy komunikat o braku fiszek jest wyświetlany
    await waitFor(() => {
      expect(screen.getByText("Brak fiszek w tej kolekcji")).toBeInTheDocument();
      expect(screen.getByText("Ta kolekcja jest pusta lub nie udało się załadować fiszek.")).toBeInTheDocument();
    });
  });
});
