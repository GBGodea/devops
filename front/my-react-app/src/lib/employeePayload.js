export function normalizePayload(form) {
  return {
    identificator: Number(form.identificator),
    name: form.name.trim(),
    surname: form.surname.trim(),
    patronymic: form.patronymic.trim() || null,
    position: form.position.trim(),
    salary: Number(form.salary),
  };
}
