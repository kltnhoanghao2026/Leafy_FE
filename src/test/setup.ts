import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  vi.spyOn(console, "groupCollapsed").mockImplementation(() => undefined);
  vi.spyOn(console, "groupEnd").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  server.resetHandlers();
  window.localStorage.clear();
});

afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});
