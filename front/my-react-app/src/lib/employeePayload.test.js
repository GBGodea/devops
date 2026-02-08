import { describe, it, expect } from "vitest";
import { normalizePayload } from "./employeePayload.js";

describe("normalizePayload", () => {
  it("trims strings, converts numbers, and normalizes patronymic", () => {
    const out = normalizePayload({
      identificator: " 42 ",
      name: " Ivan ",
      surname: " Petrov ",
      patronymic: "   ",
      position: " Dev ",
      salary: "100000",
    });

    expect(out).toEqual({
      identificator: 42,
      name: "Ivan",
      surname: "Petrov",
      patronymic: null,
      position: "Dev",
      salary: 100000,
    });
  });

  it("keeps patronymic when provided", () => {
    const out = normalizePayload({
      identificator: "1",
      name: "A",
      surname: "B",
      patronymic: " Sergeevich ",
      position: "C",
      salary: "10",
    });

    expect(out.patronymic).toBe("Sergeevich");
  });
});
