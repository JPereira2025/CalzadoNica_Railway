const express = require('express');
const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getEstilos,
  createEstilo,
  updateEstilo,
  deleteEstilo,
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getCodigos,
  createCodigo,
  updateCodigo,
  deleteCodigo,
  getFacturas,
  createFactura,
  deleteFactura,
  getStats
} = require('../controllers/apiController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const router = express.Router();

router.use(authenticateToken);

router.get('/usuarios', getUsuarios);
router.post('/usuarios', requireAdmin, createUsuario);
router.put('/usuarios', requireAdmin, updateUsuario);
router.delete('/usuarios', requireAdmin, deleteUsuario);

router.get('/empleados', getEmpleados);
router.post('/empleados', requireAdmin, createEmpleado);
router.put('/empleados', requireAdmin, updateEmpleado);
router.delete('/empleados', requireAdmin, deleteEmpleado);

router.get('/categorias', getCategorias);
router.post('/categorias', requireAdmin, createCategoria);
router.put('/categorias', requireAdmin, updateCategoria);
router.delete('/categorias', requireAdmin, deleteCategoria);

router.get('/estilos', getEstilos);
router.post('/estilos', requireAdmin, createEstilo);
router.put('/estilos', requireAdmin, updateEstilo);
router.delete('/estilos', requireAdmin, deleteEstilo);

router.get('/productos', getProductos);
router.post('/productos', requireAdmin, createProducto);
router.put('/productos', requireAdmin, updateProducto);
router.delete('/productos', requireAdmin, deleteProducto);

router.get('/codigos', getCodigos);
router.post('/codigos', requireAdmin, createCodigo);
router.put('/codigos', requireAdmin, updateCodigo);
router.delete('/codigos', requireAdmin, deleteCodigo);

router.get('/facturas', getFacturas);
router.post('/facturas', createFactura);
router.delete('/facturas', deleteFactura);

router.get('/stats', getStats);

module.exports = router;
