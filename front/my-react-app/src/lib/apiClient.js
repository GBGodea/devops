const API = "http://localhost:8081/api";

async function readTextSafe(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function fetchEmployees(fetchImpl = fetch) {
  const res = await fetchImpl(`${API}/employees`);
  if (!res.ok) {
    throw new Error(`fetchEmployees failed: ${res.status}`);
  }
  return await res.json();
}

export async function createEmployee(payload, fetchImpl = fetch) {
  const res = await fetchImpl(`${API}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    throw new Error("conflict");
  }
  if (!res.ok) {
    const text = await readTextSafe(res);
    throw new Error(`createEmployee failed: ${res.status} ${text}`.trim());
  }

  return await readTextSafe(res);
}

export async function updateEmployee(id, payload, fetchImpl = fetch) {
  const res = await fetchImpl(`${API}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    throw new Error("not_found");
  }
  if (!res.ok) {
    const text = await readTextSafe(res);
    throw new Error(`updateEmployee failed: ${res.status} ${text}`.trim());
  }

  return await readTextSafe(res);
}

export async function deleteEmployee(identificator, fetchImpl = fetch) {
  const res = await fetchImpl(`${API}/employees/${identificator}`, { method: "DELETE" });

  if (res.status === 404) {
    throw new Error("not_found");
  }
  if (!res.ok) {
    const text = await readTextSafe(res);
    throw new Error(`deleteEmployee failed: ${res.status} ${text}`.trim());
  }

  return true;
}
