export function sortEmployeesByIdentificator(employees) {
  return [...employees].sort((a, b) => (a.identificator ?? 0) - (b.identificator ?? 0));
}
