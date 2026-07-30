import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for jsdom testing
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
