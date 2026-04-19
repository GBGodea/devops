import { describe, it, expect, vi } from "vitest";
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from "./apiClient.js";

function mkRes({ ok = true, status = 200, json, text } = {}) {
  return {
    ok,
    status,
    json: json ? json : async () => {
      throw new Error("no json");
    },
    text: text ? text : async () => "",
  };
}

describe("apiClient", () => {
  it("fetchEmployees calls GET /employees and returns json", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(init).toBeUndefined();
      expect(url).toMatch(/\/api\/employees$/);
      return mkRes({ ok: true, status: 200, json: async () => [{ identificator: 1 }] });
    });

    const out = await fetchEmployees(fetchImpl);
    expect(out).toEqual([{ identificator: 1 }]);
  });

  it("fetchEmployees throws on non-ok response", async () => {
    const fetchImpl = vi.fn(async () => mkRes({ ok: false, status: 500, json: async () => [] }));

    await expect(fetchEmployees(fetchImpl)).rejects.toThrow(/500/);
  });

  it("createEmployee posts json payload", async () => {
    const payload = { identificator: 1 };
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toMatch(/\/api\/employees$/);
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      expect(init.body).toBe(JSON.stringify(payload));
      return mkRes({ ok: true, status: 201, text: async () => "Employee created" });
    });

    const out = await createEmployee(payload, fetchImpl);
    expect(out).toBe("Employee created");
  });

  it("createEmployee throws 'conflict' on 409", async () => {
    const fetchImpl = vi.fn(async () => mkRes({ ok: false, status: 409, text: async () => "" }));
    await expect(createEmployee({ identificator: 1 }, fetchImpl)).rejects.toThrow("conflict");
  });

  it("updateEmployee puts json payload and throws 'not_found' on 404", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toMatch(/\/api\/employees\//);
      expect(init.method).toBe("PUT");
      return mkRes({ ok: false, status: 404, text: async () => "" });
    });
    await expect(updateEmployee("abc", { identificator: 1 }, fetchImpl)).rejects.toThrow("not_found");
  });

  it("deleteEmployee calls DELETE and returns true on 204", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toMatch(/\/api\/employees\//);
      expect(init).toEqual({ method: "DELETE" });
      return mkRes({ ok: true, status: 204, text: async () => "" });
    });

    const out = await deleteEmployee(123, fetchImpl);
    expect(out).toBe(true);
  });
});

it("createEmployee throws detailed error on non-409 failure", async () => {
  const fetchImpl = vi.fn(async () =>
      mkRes({ ok: false, status: 500, text: async () => "db down" })
  );

  await expect(createEmployee({ identificator: 1 }, fetchImpl)).rejects.toThrow(
      "createEmployee failed: 500 db down"
  );
});

it("createEmployee returns empty string when response text read fails", async () => {
  const fetchImpl = vi.fn(async () =>
      mkRes({
        ok: true,
        status: 201,
        text: async () => {
          throw new Error("broken stream");
        },
      })
  );

  const out = await createEmployee({ identificator: 1 }, fetchImpl);
  expect(out).toBe("");
});

it("updateEmployee returns response text on success", async () => {
  const payload = { identificator: 1 };
  const fetchImpl = vi.fn(async (url, init) => {
    expect(url).toMatch(/\/api\/employees\/42$/);
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify(payload));
    return mkRes({ ok: true, status: 200, text: async () => "updated" });
  });

  const out = await updateEmployee(42, payload, fetchImpl);
  expect(out).toBe("updated");
});

it("updateEmployee throws detailed error on non-404 failure", async () => {
  const fetchImpl = vi.fn(async () =>
      mkRes({ ok: false, status: 500, text: async () => "server error" })
  );

  await expect(updateEmployee(42, { identificator: 1 }, fetchImpl)).rejects.toThrow(
      "updateEmployee failed: 500 server error"
  );
});

it("deleteEmployee throws not_found on 404", async () => {
  const fetchImpl = vi.fn(async () =>
      mkRes({ ok: false, status: 404, text: async () => "" })
  );

  await expect(deleteEmployee(123, fetchImpl)).rejects.toThrow("not_found");
});

it("deleteEmployee throws detailed error on non-404 failure", async () => {
  const fetchImpl = vi.fn(async () =>
      mkRes({ ok: false, status: 500, text: async () => "cannot delete" })
  );

  await expect(deleteEmployee(123, fetchImpl)).rejects.toThrow(
      "deleteEmployee failed: 500 cannot delete"
  );
});