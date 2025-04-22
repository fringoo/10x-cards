import React from "react";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
// Make vitest's expect available globally for jest-dom/vitest
(globalThis as unknown as { expect: typeof expect }).expect = expect;
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GenerateFlashcardsForm } from "./GenerateFlashcardsForm";

let originalLocationDescriptor: PropertyDescriptor | undefined;

beforeAll(() => {
  // Save original window.location descriptor
  originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");
  // Override window.location for tests
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "" },
  });
});

afterAll(() => {
  // Restore original window.location
  if (originalLocationDescriptor) {
    Object.defineProperty(window, "location", originalLocationDescriptor);
  }
});

describe("GenerateFlashcardsForm", () => {
  beforeEach(() => {
    // Mock global.fetch for success
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);
  });

  it("shows validation error for empty textarea", async () => {
    render(<GenerateFlashcardsForm />);
    fireEvent.click(screen.getByRole("button", { name: /Generuj fiszki/i }));
    expect(await screen.findByText(/must contain at least 10/i)).toBeInTheDocument();
  });

  it("submits valid text and calls API", async () => {
    render(<GenerateFlashcardsForm />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "A".repeat(20) } });
    fireEvent.click(screen.getByRole("button", { name: /Generuj fiszki/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/flashcards/generate",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays API error message on error response", async () => {
    // Mock fetch to return error
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Test error" } }),
    } as unknown as Response);

    render(<GenerateFlashcardsForm />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "A".repeat(20) } });
    fireEvent.click(screen.getByRole("button", { name: /Generuj fiszki/i }));

    expect(await screen.findByText(/Test error/i)).toBeInTheDocument();
  });

  it("handles network error gracefully", async () => {
    // Mock fetch to throw
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network failure"));

    render(<GenerateFlashcardsForm />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "A".repeat(20) } });
    fireEvent.click(screen.getByRole("button", { name: /Generuj fiszki/i }));

    expect(await screen.findByText(/Brak połączenia z serwerem/i)).toBeInTheDocument();
  });
});
