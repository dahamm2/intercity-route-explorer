export function formatRouteTooltipLabel(agency, name) {
  const operator = String(agency ?? "").trim();
  const routeName = String(name ?? "").trim();
  if (operator && routeName) return `${operator} · ${routeName}`;
  return operator || routeName;
}
