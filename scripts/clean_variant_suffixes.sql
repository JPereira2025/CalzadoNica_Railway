-- Elimina variantes con sufijos aleatorios creados por el fallback y marca las filas para recrear.
-- ADVERTENCIA: Ejecutar sólo si confirmas que los IDs con sufijo no deben mantenerse.

BEGIN;

-- Verifica primero qué registros tienen sufijo adicional
SELECT id, marca, modelo, talla, color, categoria_id, estilo_id, precio, stock
FROM productos
WHERE id ~ '-[A-Z0-9]{4}$'
ORDER BY id;

-- Elimina los registros cuya parte final parece sufijo aleatorio de 4 caracteres
DELETE FROM productos
WHERE id ~ '-[A-Z0-9]{4}$';

COMMIT;

-- Opcional: si prefieres recrearlos manualmente, usa tus datos originales.
-- Nota: este script elimina sólo los IDs que terminan en "-XXXX" de 4 caracteres.
