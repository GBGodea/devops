import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8081/api";

const empty = {
  identificator: "",
  name: "",
  surname: "",
  patronymic: "",
  position: "",
  salary: "",
};

function normalizePayload(form) {
  return {
    identificator: Number(form.identificator),
    name: form.name.trim(),
    surname: form.surname.trim(),
    patronymic: form.patronymic.trim() || null,
    position: form.position.trim(),
    salary: Number(form.salary),
  };
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>{title}</div>
          <button style={styles.iconButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={styles.td}>
          <div style={styles.skel} />
        </td>
      ))}
    </tr>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [createForm, setCreateForm] = useState(empty);

  const [editing, setEditing] = useState(null); // employee object
  const [editForm, setEditForm] = useState(empty);

  const [toast, setToast] = useState(null); // {type, text}
  const [loading, setLoading] = useState(false);

  const sorted = useMemo(() => {
    return [...employees].sort((a, b) => (a.identificator ?? 0) - (b.identificator ?? 0));
  }, [employees]);

  function showToast(type, text) {
    setToast({ type, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3200);
  }

  function onChange(setter) {
    return (e) => setter((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function loadEmployees() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/employees`);
      if (!res.ok) {
        showToast("err", `Не удалось загрузить список (status ${res.status})`);
        return;
      }
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      showToast("err", `Ошибка сети: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function createEmployee(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(createForm)),
      });

      if (res.status === 409) {
        showToast("err", "Сотрудник с таким identificator уже существует (409).");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        showToast("err", `Ошибка создания (status ${res.status}) ${text}`);
        return;
      }

      setCreateForm(empty);
      showToast("ok", "Сотрудник добавлен");
      await loadEmployees();
    } catch (e) {
      showToast("err", `Ошибка сети: ${String(e)}`);
    }
  }

  function openEdit(emp) {
    setEditing(emp);
    setEditForm({
      identificator: String(emp.identificator ?? ""),
      name: emp.name ?? "",
      surname: emp.surname ?? "",
      patronymic: emp.patronymic ?? "",
      position: emp.position ?? "",
      salary: String(emp.salary ?? ""),
    });
  }

  function closeEdit() {
    setEditing(null);
    setEditForm(empty);
  }

  async function saveEdit() {
    if (!editing?.id) return;

    try {
      const res = await fetch(`${API}/employees/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(editForm)),
      });

      if (res.status === 404) {
        showToast("err", "Сотрудник не найден (404).");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        showToast("err", `Ошибка обновления (status ${res.status}) ${text}`);
        return;
      }

      closeEdit();
      showToast("ok", "Данные обновлены");
      await loadEmployees();
    } catch (e) {
      showToast("err", `Ошибка сети: ${String(e)}`);
    }
  }

  async function removeEmployee(emp) {
    const ok = window.confirm(`Удалить сотрудника #${emp.identificator} (${emp.name} ${emp.surname})?`);
    if (!ok) return;

    try {
      // delete by identificator (по твоему контроллеру)
      const res = await fetch(`${API}/employees/${emp.identificator}`, { method: "DELETE" });

      if (res.status === 404) {
        showToast("err", "Сотрудник не найден (404).");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        showToast("err", `Ошибка удаления (status ${res.status}) ${text}`);
        return;
      }

      showToast("ok", "Сотрудник удалён");
      await loadEmployees();
    } catch (e) {
      showToast("err", `Ошибка сети: ${String(e)}`);
    }
  }

  return (
    <div style={styles.page}>
      {/* мягкая динамика фона */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.shell}>
        <header style={styles.header}>

          <div style={styles.headerRight}>
            <button style={styles.secondaryBtn} onClick={loadEmployees} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {toast && (
          <div style={{ ...styles.toast, ...(toast.type === "ok" ? styles.toastOk : styles.toastErr) }}>
            {toast.text}
          </div>
        )}

        <main style={styles.main}>
          {/* Левая колонка */}
          <section style={{ ...styles.card, ...styles.cardLift }}>
            <div style={styles.cardTitle}>Добавить сотрудника</div>

            <form onSubmit={createEmployee} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>identificator</label>
                <input style={styles.input} name="identificator" value={createForm.identificator} onChange={onChange(setCreateForm)} required />
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>name</label>
                  <input style={styles.input} name="name" value={createForm.name} onChange={onChange(setCreateForm)} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>surname</label>
                  <input style={styles.input} name="surname" value={createForm.surname} onChange={onChange(setCreateForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>patronymic</label>
                  <input style={styles.input} name="patronymic" value={createForm.patronymic} onChange={onChange(setCreateForm)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>position</label>
                  <input style={styles.input} name="position" value={createForm.position} onChange={onChange(setCreateForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>salary</label>
                  <input style={styles.input} name="salary" value={createForm.salary} onChange={onChange(setCreateForm)} required />
                </div>

                <button type="submit" style={styles.primaryBtn}>
                  Add
                </button>
              </div>
            </form>
          </section>

          {/* Правая колонка */}
          <section style={{ ...styles.card, ...styles.tableCard, ...styles.cardLift }}>
            <div style={styles.tableHeader}>
              <div>
                <div style={styles.cardTitle}>&nbsp;Сотрудники</div>
                <div style={styles.smallText}>Карандаш — редактировать, корзина — удалить</div>
              </div>
              <div style={styles.pill}>{sorted.length} items</div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Surname</th>
                    <th style={styles.th}>Patronymic</th>
                    <th style={styles.th}>Position</th>
                    <th style={styles.th}>Salary</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, padding: 18, opacity: 0.7 }}>
                        Пока пусто. Добавь сотрудника слева 🙂
                      </td>
                    </tr>
                  ) : (
                    sorted.map((emp) => (
                      <tr key={emp.id} style={styles.tr}>
                        <td style={styles.tdMono}>{emp.identificator}</td>
                        <td style={styles.td}>{emp.name}</td>
                        <td style={styles.td}>{emp.surname}</td>
                        <td style={styles.td}>{emp.patronymic ?? ""}</td>
                        <td style={styles.td}>{emp.position}</td>
                        <td style={styles.tdMono}>{emp.salary}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button style={styles.iconBtn} onClick={() => openEdit(emp)} title="Edit">
                            ✏️
                          </button>
                          <button style={{ ...styles.iconBtn, ...styles.dangerIconBtn }} onClick={() => removeEmployee(emp)} title="Delete">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <Modal open={!!editing} title={`Редактирование: #${editing?.identificator ?? ""}`} onClose={closeEdit}>
          <div style={styles.modalGrid}>
            <div style={styles.field}>
              <label style={styles.label}>identificator</label>
              <input style={styles.input} name="identificator" value={editForm.identificator} onChange={onChange(setEditForm)} required />
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>name</label>
                <input style={styles.input} name="name" value={editForm.name} onChange={onChange(setEditForm)} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>surname</label>
                <input style={styles.input} name="surname" value={editForm.surname} onChange={onChange(setEditForm)} required />
              </div>
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>patronymic</label>
                <input style={styles.input} name="patronymic" value={editForm.patronymic} onChange={onChange(setEditForm)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>position</label>
                <input style={styles.input} name="position" value={editForm.position} onChange={onChange(setEditForm)} required />
              </div>
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>salary</label>
                <input style={styles.input} name="salary" value={editForm.salary} onChange={onChange(setEditForm)} required />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "end" }}>
                <button style={styles.secondaryBtn} onClick={closeEdit} type="button">
                  Cancel
                </button>
                <button style={styles.primaryBtn} onClick={saveEdit} type="button">
                  Save
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    overflowX: "hidden",
    position: "relative",
    background: "radial-gradient(1200px 800px at 20% 10%, #1b2a52 0%, rgba(27,42,82,0) 60%), radial-gradient(900px 700px at 75% 20%, #3b1f66 0%, rgba(59,31,102,0) 60%), radial-gradient(900px 700px at 50% 90%, #0b3d2e 0%, rgba(11,61,46,0) 55%), linear-gradient(180deg, #070b14 0%, #050a12 100%)",
    color: "#e9eef8",
    padding: "22px 18px 26px",
  },

  // animated blobs (простая “динамика” без canvas)
  blob1: {
    position: "absolute",
    inset: "auto auto -260px -280px",
    width: 560,
    height: 560,
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.45), rgba(99,102,241,0) 65%)",
    filter: "blur(2px)",
    animation: "float1 10s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    inset: "-280px -260px auto auto",
    width: 640,
    height: 640,
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.35), rgba(236,72,153,0) 65%)",
    filter: "blur(2px)",
    animation: "float2 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    inset: "auto 18% 10% auto",
    width: 520,
    height: 520,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, rgba(34,197,94,0.22), rgba(34,197,94,0) 65%)",
    filter: "blur(2px)",
    animation: "float3 14s ease-in-out infinite",
    pointerEvents: "none",
  },

  shell: {
    maxWidth: 1500,           // было меньше — теперь шире на 1920
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 14,
    animation: "fadeIn 420ms ease-out",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    background: "linear-gradient(180deg, rgba(99,102,241,1) 0%, rgba(79,70,229,1) 100%)",
    boxShadow: "0 18px 40px rgba(79,70,229,0.35)",
  },
  title: { fontSize: 26, fontWeight: 900, letterSpacing: 0.2 },
  subtitle: { opacity: 0.7, fontSize: 13, marginTop: 2 },

  headerRight: { display: "flex", gap: 10, alignItems: "center" },

  badge: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12,
    opacity: 0.9,
  },

  toast: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    animation: "slideDown 260ms ease-out",
    backdropFilter: "blur(8px)",
  },
  toastOk: {
    borderColor: "rgba(46, 213, 115, 0.35)",
    background: "rgba(46, 213, 115, 0.12)",
  },
  toastErr: {
    borderColor: "rgba(255, 107, 107, 0.35)",
    background: "rgba(255, 107, 107, 0.12)",
  },

  main: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 16,
    alignItems: "start",
  },

  card: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.40)",
    padding: 16,
    backdropFilter: "blur(10px)",
  },

  cardLift: {
    transform: "translateY(0)",
    transition: "transform 220ms ease, box-shadow 220ms ease, background 220ms ease",
  },

  tableCard: {
    padding: 0,
    overflow: "hidden",
  },

  cardTitle: { fontSize: 14, fontWeight: 800, opacity: 0.95 },

  smallText: { fontSize: 12, opacity: 0.65, marginTop: 4 },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },

  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12,
    opacity: 0.9,
  },

  form: { display: "grid", gap: 10, marginTop: 10 },

  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "end",
  },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, opacity: 0.72 },

  input: {
    padding: "11px 12px",
    borderRadius: 14,
    outline: "none",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "#e9eef8",
    transition: "transform 120ms ease, border-color 150ms ease",
  },

  primaryBtn: {
    padding: "11px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(99,102,241,0.95) 0%, rgba(79,70,229,0.95) 100%)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    transition: "transform 120ms ease, filter 160ms ease",
  },

  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#e9eef8",
    fontWeight: 700,
    cursor: "pointer",
  },

  hint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.04)",
    fontSize: 12,
    opacity: 0.75,
  },

  tableWrap: { overflow: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },

  th: {
    textAlign: "left",
    fontSize: 12,
    opacity: 0.72,
    padding: "12px 14px",
    position: "sticky",
    top: 0,
    background: "rgba(12, 18, 34, 0.92)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    zIndex: 1,
  },

  tr: {
    transition: "background 140ms ease",
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  tdMono: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    opacity: 0.95,
  },

  iconBtn: {
    padding: "8px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#e9eef8",
    cursor: "pointer",
    marginLeft: 8,
    transition: "transform 120ms ease, background 140ms ease",
  },

  dangerIconBtn: {
    background: "rgba(255, 107, 107, 0.14)",
    borderColor: "rgba(255, 107, 107, 0.25)",
  },

  // skeleton shimmer
  skel: {
    height: 12,
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s ease-in-out infinite",
  },

  footer: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "4px 2px",
    animation: "fadeIn 520ms ease-out",
  },

  // modal
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50,
  },
  modal: {
    width: "min(780px, 100%)",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(12, 18, 34, 0.98)",
    boxShadow: "0 40px 120px rgba(0,0,0,0.70)",
    overflow: "hidden",
    animation: "pop 180ms ease-out",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
  },
  modalTitle: { fontWeight: 900, letterSpacing: 0.2 },
  modalBody: { padding: 16 },
  modalGrid: { display: "grid", gap: 12 },
  iconButton: {
    padding: "6px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#e9eef8",
    cursor: "pointer",
  },
};

// ⚡️ Небольшой CSS для hover + keyframes (вставляем через <style>)
// (в React можно просто рендерить один раз)
const css = `
  @keyframes shimmer { 
    0% { background-position: 200% 0; } 
    100% { background-position: -200% 0; } 
  }
  @keyframes pop {
    from { transform: translateY(6px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes float1 { 
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(18px, -12px); }
  }
  @keyframes float2 { 
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-22px, 16px); }
  }
  @keyframes float3 { 
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(14px, 20px); }
  }
  table tr:hover td { background: rgba(255,255,255,0.04); }
  input:focus { border-color: rgba(99,102,241,0.55) !important; }
  button:hover { filter: brightness(1.05); }
  button:active { transform: translateY(1px); }
`;

(function injectCssOnce() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__ui_css")) return;
  const s = document.createElement("style");
  s.id = "__ui_css";
  s.textContent = css;
  document.head.appendChild(s);
})();
