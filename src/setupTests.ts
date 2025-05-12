import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// Rozszerzam matchers dla expect
expect.extend(matchers);

// Globalne mock-e
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset wszysktich mocków przed każdym testem
beforeEach(() => {
  vi.resetAllMocks();
});
