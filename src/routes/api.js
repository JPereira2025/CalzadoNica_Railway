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

// Nota: no aplicar autenticación global para permitir endpoints públicos
// (p. ej. listar productos) — proteger solo las rutas que requieren admin.

router.get('/usuarios', authenticateToken, requireAdmin, getUsuarios);
router.post('/usuarios', authenticateToken, requireAdmin, createUsuario);
router.put('/usuarios', authenticateToken, requireAdmin, updateUsuario);
router.delete('/usuarios', authenticateToken, requireAdmin, deleteUsuario);

router.get('/empleados', authenticateToken, requireAdmin, getEmpleados);
router.post('/empleados', authenticateToken, requireAdmin, createEmpleado);
router.put('/empleados', authenticateToken, requireAdmin, updateEmpleado);
router.delete('/empleados', authenticateToken, requireAdmin, deleteEmpleado);

router.get('/categorias', getCategorias);
router.post('/categorias', authenticateToken, requireAdmin, createCategoria);
router.put('/categorias', authenticateToken, requireAdmin, updateCategoria);
router.delete('/categorias', authenticateToken, requireAdmin, deleteCategoria);

router.get('/estilos', getEstilos);
router.post('/estilos', authenticateToken, requireAdmin, createEstilo);
router.put('/estilos', authenticateToken, requireAdmin, updateEstilo);
router.delete('/estilos', authenticateToken, requireAdmin, deleteEstilo);

router.get('/productos', getProductos);
router.post('/productos', authenticateToken, requireAdmin, createProducto);
router.put('/productos', authenticateToken, requireAdmin, updateProducto);
router.delete('/productos', authenticateToken, requireAdmin, deleteProducto);

// Subir imagen de producto (admin)
const multer = require('multer');
const path = require('path');
const imgDir = path.join(__dirname, '..', '..', 'public', 'tienda', 'img');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imgDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

router.post('/productos/:id/imagenes', authenticateToken, requireAdmin, upload.single('imagen'), (req, res, next) => {
  // delegado al controlador para mantener lógica ahí
  req.file && (req.file.url = `/tienda/img/${req.file.filename}`);
  // import controlador dinámicamente para evitar ciclos
  const { uploadProductoImagen } = require('../controllers/apiController');
  return uploadProductoImagen(req, res, next);
});

// NOTE: debug upload route removed; use authenticated route POST /api/productos/:id/imagenes

// Listar imágenes de un producto (pública)
router.get('/productos/:id/imagenes', (req, res) => {
  const { getProductoImagenes } = require('../controllers/apiController');
  return getProductoImagenes(req, res);
});

// Eliminar imagen
router.delete('/productos/:id/imagenes/:imgId', authenticateToken, requireAdmin, (req, res) => {
  const { deleteProductoImagen } = require('../controllers/apiController');
  return deleteProductoImagen(req, res);
});

// Marcar imagen como principal
router.post('/productos/:id/imagenes/:imgId/principal', authenticateToken, requireAdmin, (req, res) => {
  const { setPrincipalImagen } = require('../controllers/apiController');
  return setPrincipalImagen(req, res);
});

router.get('/codigos', getCodigos);
router.post('/codigos', authenticateToken, requireAdmin, createCodigo);
router.put('/codigos', authenticateToken, requireAdmin, updateCodigo);
router.delete('/codigos', authenticateToken, requireAdmin, deleteCodigo);

router.get('/facturas', getFacturas);
router.post('/facturas', createFactura);
router.delete('/facturas', deleteFactura);

router.get('/stats', getStats);

module.exports = router;
