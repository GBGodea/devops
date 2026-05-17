import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizePayload } from "./lib/employeePayload.js";
import { sortEmployeesByIdentificator } from "./lib/sortEmployees.js";
import {
  createEmployee as apiCreateEmployee,
  deleteEmployee as apiDeleteEmployee,
  fetchEmployees as apiFetchEmployees,
  updateEmployee as apiUpdateEmployee,
} from "./lib/apiClient.js";

const empty = {
  identificator: "",
  name: "",
  surname: "",
  patronymic: "",
  position: "",
  salary: "",
};

const skeletonCellKeys = ["id", "name", "surname", "patronymic", "position", "salary", "actions"];
const skeletonRowKeys = ["row-1", "row-2", "row-3", "row-4", "row-5"];

function createChangeHandler(setter) {
  return (event) => setter((previous) => ({ ...previous, [event.target.name]: event.target.value }));
}

function renderModal(options) {
  const { open, title, children, onClose } = options;

  if (!open) return null;

  return (
    <div style={styles.modalLayer}>
      <button type="button" style={styles.backdrop} onClick={onClose} aria-label="Close modal" />
      <section style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="employee-edit-title">
        <div style={styles.modalHeader}>
          <div id="employee-edit-title" style={styles.modalTitle}>{title}</div>
          <button style={styles.iconButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </section>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {skeletonCellKeys.map((key) => (
        <td key={key} style={styles.td}>
          <div style={styles.skel} />
        </td>
      ))}
    </tr>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [createForm, setCreateForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(empty);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const toastTimeoutId = useRef(null);

  const sorted = useMemo(() => {
    return sortEmployeesByIdentificator(employees);
  }, [employees]);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    globalThis.clearTimeout(toastTimeoutId.current);
    toastTimeoutId.current = globalThis.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchEmployees();
      setEmployees(data);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("fetchEmployees failed:")) {
        const status = msg.split("fetchEmployees failed:").pop()?.trim();
        showToast("err", `Не удалось загрузить список (status ${status})`);
      } else {
        showToast("err", `Ошибка сети: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    return () => globalThis.clearTimeout(toastTimeoutId.current);
  }, []);

  async function createEmployee(e) {
    e.preventDefault();
    try {
      await apiCreateEmployee(normalizePayload(createForm));

      setCreateForm(empty);
      showToast("ok", "Сотрудник добавлен");
      await loadEmployees();
    } catch (e) {
      if (String(e) === "Error: conflict") {
        showToast("err", "Сотрудник с таким identificator уже существует (409)."
        );
        return;
      }
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
      await apiUpdateEmployee(editing.id, normalizePayload(editForm));

      closeEdit();
      showToast("ok", "Данные обновлены");
      await loadEmployees();
    } catch (e) {
      if (String(e) === "Error: not_found") {
        showToast("err", "Сотрудник не найден (404)."
        );
        return;
      }
      showToast("err", `Ошибка сети: ${String(e)}`);
    }
  }

  async function removeEmployee(emp) {
    const ok = globalThis.confirm(`Удалить сотрудника #${emp.identificator} (${emp.name} ${emp.surname})?`);
    if (!ok) return;

    try {
      await apiDeleteEmployee(emp.identificator);

      showToast("ok", "Сотрудник удалён");
      await loadEmployees();
    } catch (e) {
      if (String(e) === "Error: not_found") {
        showToast("err", "Сотрудник не найден (404)."
        );
        return;
      }
      showToast("err", `Ошибка сети: ${String(e)}`);
    }
  }

  let tableRows;
  if (loading) {
    tableRows = skeletonRowKeys.map((key) => <SkeletonRow key={key} />);
  } else if (sorted.length === 0) {
    tableRows = (
      <tr>
        <td colSpan={7} style={{ ...styles.td, padding: 18, opacity: 0.7 }}>
          Пока пусто. Добавь сотрудника слева 🙂
        </td>
      </tr>
    );
  } else {
    tableRows = sorted.map((emp) => (
      <tr key={emp.id} style={styles.tr}>
        <td style={styles.tdMono}>{emp.identificator}</td>
        <td style={styles.td}>{emp.name}</td>
        <td style={styles.td}>{emp.surname}</td>
        <td style={styles.td}>{emp.patronymic ?? ""}</td>
        <td style={styles.td}>{emp.position}</td>
        <td style={styles.tdMono}>{emp.salary}</td>
        <td style={{ ...styles.td, textAlign: "right" }}>
          <button type="button" style={styles.iconBtn} onClick={() => openEdit(emp)} title="Edit" aria-label={`Edit employee ${emp.identificator}`}>
            ✏️
          </button>
          <button type="button" style={{ ...styles.iconBtn, ...styles.dangerIconBtn }} onClick={() => removeEmployee(emp)} title="Delete" aria-label={`Delete employee ${emp.identificator}`}>
            🗑️
          </button>
        </td>
      </tr>
    ));
  }

  return (
    <div style={styles.page}>
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
          <section style={{ ...styles.card, ...styles.cardLift }}>
            <div style={styles.cardTitle}>Добавить сотрудника</div>

            <form onSubmit={createEmployee} style={styles.form}>
              <div style={styles.field}>
                <label htmlFor="create-identificator" style={styles.label}>identificator</label>
                <input id="create-identificator" style={styles.input} name="identificator" value={createForm.identificator} onChange={createChangeHandler(setCreateForm)} required />
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="create-name" style={styles.label}>name</label>
                  <input id="create-name" style={styles.input} name="name" value={createForm.name} onChange={createChangeHandler(setCreateForm)} required />
                </div>
                <div style={styles.field}>
                  <label htmlFor="create-surname" style={styles.label}>surname</label>
                  <input id="create-surname" style={styles.input} name="surname" value={createForm.surname} onChange={createChangeHandler(setCreateForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="create-patronymic" style={styles.label}>patronymic</label>
                  <input id="create-patronymic" style={styles.input} name="patronymic" value={createForm.patronymic} onChange={createChangeHandler(setCreateForm)} />
                </div>
                <div style={styles.field}>
                  <label htmlFor="create-position" style={styles.label}>position</label>
                  <input id="create-position" style={styles.input} name="position" value={createForm.position} onChange={createChangeHandler(setCreateForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="create-salary" style={styles.label}>salary</label>
                  <input id="create-salary" style={styles.input} name="salary" value={createForm.salary} onChange={createChangeHandler(setCreateForm)} required />
                </div>

                <button type="submit" style={styles.primaryBtn}>
                  Add
                </button>
              </div>
            </form>
          </section>

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
                  {tableRows}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {renderModal({
          open: !!editing,
          title: `Редактирование: #${editing?.identificator ?? ""}`,
          onClose: closeEdit,
          children: (
            <div style={styles.modalGrid}>
              <div style={styles.field}>
                <label htmlFor="edit-identificator" style={styles.label}>identificator</label>
                <input id="edit-identificator" style={styles.input} name="identificator" value={editForm.identificator} onChange={createChangeHandler(setEditForm)} required />
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="edit-name" style={styles.label}>name</label>
                  <input id="edit-name" style={styles.input} name="name" value={editForm.name} onChange={createChangeHandler(setEditForm)} required />
                </div>
                <div style={styles.field}>
                  <label htmlFor="edit-surname" style={styles.label}>surname</label>
                  <input id="edit-surname" style={styles.input} name="surname" value={editForm.surname} onChange={createChangeHandler(setEditForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="edit-patronymic" style={styles.label}>patronymic</label>
                  <input id="edit-patronymic" style={styles.input} name="patronymic" value={editForm.patronymic} onChange={createChangeHandler(setEditForm)} />
                </div>
                <div style={styles.field}>
                  <label htmlFor="edit-position" style={styles.label}>position</label>
                  <input id="edit-position" style={styles.input} name="position" value={editForm.position} onChange={createChangeHandler(setEditForm)} required />
                </div>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="edit-salary" style={styles.label}>salary</label>
                  <input id="edit-salary" style={styles.input} name="salary" value={editForm.salary} onChange={createChangeHandler(setEditForm)} required />
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
          ),
        })}
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
    maxWidth: 1500,
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

  modalLayer: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    border: 0,
    padding: 0,
    background: "rgba(0,0,0,0.62)",
    cursor: "pointer",
  },
  modal: {
    position: "relative",
    zIndex: 1,
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
  if (typeof globalThis.document === "undefined") return;
  if (globalThis.document.getElementById("__ui_css")) return;
  const s = globalThis.document.createElement("style");
  s.id = "__ui_css";
  s.textContent = css;
  globalThis.document.head.appendChild(s);
})();
