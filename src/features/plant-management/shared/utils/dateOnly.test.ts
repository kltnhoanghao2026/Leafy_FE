import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  compareDateOnly,
  daysBetweenDateOnly,
  isValidDateOnly,
  parseLocalDateOnly,
  toLocalDateOnly,
} from "./dateOnly";

describe("dateOnly utilities", () => {
  it("formats and parses local date-only values without UTC slicing", () => {
    const parsed = parseLocalDateOnly("2026-04-27");

    expect(parsed).not.toBeNull();
    expect(toLocalDateOnly(parsed as Date)).toBe("2026-04-27");
  });

  it("rejects invalid date-only values", () => {
    expect(isValidDateOnly("2026-02-29")).toBe(false);
    expect(isValidDateOnly("2026-04-31")).toBe(false);
    expect(isValidDateOnly("2026-04-27")).toBe(true);
  });

  it("adds and compares local date-only values", () => {
    expect(addLocalDays("2026-04-27", 7)).toBe("2026-05-04");
    expect(daysBetweenDateOnly("2026-04-27", "2026-05-04")).toBe(7);
    expect(compareDateOnly("2026-05-04", "2026-04-27")).toBeGreaterThan(0);
  });
});
