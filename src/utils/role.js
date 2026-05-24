function normalizeRole(role) {
  const map = {
    admin: 'Administrador',
    administrador: 'Administrador',
    vendedor: 'Vendedor',
    gerente: 'Gerente'
  };

  if (!role) return 'Vendedor';
  const lower = role.toString().trim().toLowerCase();
  return map[lower] || role;
}

module.exports = { normalizeRole };
