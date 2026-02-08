import { describe, it, expect } from "vitest";
import { sortEmployeesByIdentificator } from "./sortEmployees.js";

describe("sortEmployeesByIdentificator", () => {
  it("sorts by identificator ascending and treats null/undefined as 0", () => {
    const input = [
      { identificator: 5 },
      { identificator: null },
      { identificator: 2 },
      {},
      { identificator: 1 },
    ];

    const out = sortEmployeesByIdentificator(input);

    expect(out.map((e) => e.identificator ?? 0)).toEqual([0, 0, 1, 2, 5]);
  });

  it("does not mutate input array", () => {
    const input = [{ identificator: 2 }, { identificator: 1 }];
    const copy = [...input];

    sortEmployeesByIdentificator(input);

    expect(input).toEqual(copy);
  });
});
