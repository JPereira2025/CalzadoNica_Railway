-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 27-11-2025 a las 03:26:03
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `calzado_nica`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`) VALUES
('CAT-BOT-001', 'Botas de cuero', 'Botas de trabajo pesado, Botas Vaqueras, Botas de Lujo, botas largas y botines'),
('CAT-CUE-001', 'Cuero Sintetico', 'Zapatos casuales para caballeros, para vestir elegante'),
('CAT-DEP-001', 'Deportivos', 'Zapatos deportivos cómodos para toda la familia'),
('CAT-DEP-002', 'Deportivos Infantiles', 'Zapatos deportivos infantiles, para el gusto de los reyes del hogar'),
('CAT-ZAP-002', 'Zapatillas de Cuero', 'Zapatillas para toda Ocasión, vestir cómodo y lujoso'),
('CAT-ZAP-003', 'Zapatos de Tacon', 'Zapatos para damas elegantes para toda ocasion');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `codigos_promocionales`
--

CREATE TABLE `codigos_promocionales` (
  `id` varchar(20) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `porcentaje_descuento` int(3) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `codigos_promocionales`
--

INSERT INTO `codigos_promocionales` (`id`, `codigo`, `porcentaje_descuento`, `fecha_inicio`, `fecha_fin`, `estado`, `descripcion`) VALUES
('', 'Navidad2025', 25, '2025-11-15', '2025-12-01', 1, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `sueldo` decimal(10,2) NOT NULL,
  `nacimiento` date NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `sexo` enum('Masculino','Femenino','Otro') NOT NULL,
  `estado_civil` varchar(50) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` text NOT NULL,
  `cargo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id`, `nombres`, `apellidos`, `sueldo`, `nacimiento`, `cedula`, `sexo`, `estado_civil`, `telefono`, `direccion`, `cargo`) VALUES
('EMP-GGA-19691212', 'Georgina del Carmen', 'Gonzalez Abarca', 38000.00, '1969-12-12', '021-121269-0018G', 'Femenino', 'Casado/a', '67686970', 'Tipitapa, de la entrada a los termales 5 cudras al sur', 'Administrador'),
('EMP-JCL-20000717', 'Jhonn Xavi', 'Cotton Lizz', 29900.00, '2000-07-17', '001-170700-0012M', 'Masculino', 'Casado/a', '77668899', 'Rotonda Ticuantepe 200 metros al sur', 'Responsable Almacen'),
('EMP-JGM-19961117', 'Julio Emilio', 'Guadamuz Medrano', 85000.00, '1996-11-17', '001-171196-0005L', 'Masculino', 'Casado/a', '87687685', 'Subasta 200 metros al Norte', 'Gerencia Recursos Humanos'),
('EMP-JJS-20001016', 'José Javier', 'Solís Medrano', 15000.00, '2000-10-16', '401-161000-0087L', 'Masculino', '', '88887777', 'Frente a la Rolter', 'Vendedor'),
('EMP-JPH-19720928', 'Jorge Alberto', 'Pereira Hernández', 105000.00, '1972-09-28', '001-280972-0059K', 'Masculino', 'Casado/a', '87563793', 'Terminal Ruta 101 Las Brisas, 3C al este, 2C al norte', 'Gerente General'),
('EMP-OMR-20001001', 'Oswaldo Emilio', 'Martínez Rivera', 50000.00, '2000-10-01', '001-011000-0528E', 'Masculino', 'Casado/a', '88778877', 'Tipitapa, Frente donde fue Mama Naya', 'Gerente de Ventas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estilos`
--

CREATE TABLE `estilos` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estilos`
--

INSERT INTO `estilos` (`id`, `nombre`, `descripcion`) VALUES
('EST-BOT-001', 'Botas Vaqueras de Niño', 'Botas para los reyes de la casa, vaqueras con terminado unico'),
('EST-CUE-001', 'Cuero Sintetico', 'Zapatos casuales para vestir elegante, comodos y a la moda'),
('EST-DEP-001', 'Deportivo Hombre', 'Deportivos para hacer ejercicios, pasear en el parque o verse deportivo'),
('EST-DEP-002', 'Deportivos para damas', 'Zapatos para hacer ejercicios, caminar o simplemente para sentirte cómoda'),
('EST-DEP-003', 'Deportivos infantiles', ' Zapatos para niños y niñas, deportivos, casuales y cómodos'),
('EST-FUT-001', 'futbol sala', 'zapatos para jugar futbol sala'),
('EST-ZAP-001', 'Zapatos Tacon Alto', 'Zapatos para damas, con estilos altos de 20 -25 cm');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` varchar(20) NOT NULL,
  `cliente` varchar(255) NOT NULL,
  `vendedor` varchar(50) NOT NULL,
  `fecha` datetime NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `monto_descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `codigo_descuento` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id`, `cliente`, `vendedor`, `fecha`, `subtotal`, `monto_descuento`, `iva`, `total`, `codigo_descuento`) VALUES
('FACT-0001', 'Jason Luna', 'admin', '2025-11-20 02:59:32', 3200.00, 800.00, 360.00, 2760.00, 'Navidad2025');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_items`
--

CREATE TABLE `factura_items` (
  `id` int(11) NOT NULL,
  `id_factura` varchar(20) NOT NULL,
  `id_producto` varchar(50) NOT NULL,
  `nombre_producto` varchar(255) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `factura_items`
--

INSERT INTO `factura_items` (`id`, `id_factura`, `id_producto`, `nombre_producto`, `cantidad`, `precio_unitario`) VALUES
(21, 'FACT-0001', 'PROD-AD-002', 'Adidas Zamba (Stock: 25)', 1, 1750.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` varchar(50) NOT NULL,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `talla` varchar(10) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `categoria_id` varchar(20) DEFAULT NULL,
  `estilo_id` varchar(20) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `marca`, `modelo`, `talla`, `color`, `categoria_id`, `estilo_id`, `precio`, `stock`) VALUES
('PROD-AD-002', 'Adidas', 'Zamba', '38', 'Blanco', 'CAT-DEP-001', 'EST-DEP-001', 1750.00, 25),
('PROD-FR-001', 'Fila', 'Ray', '39', '0', 'CAT-DEP-001', 'EST-DEP-001', 2225.00, 25),
('PROD-NI-003', 'Nike', 'Zoom', '36', 'Negro', 'CAT-DEP-001', 'EST-DEP-001', 1450.00, 25),
('PROD-SZ-001', 'SZX', 'ZzZ23', '23', '0', 'CAT-DEP-001', 'EST-DEP-001', 23232.00, 32);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_backup`
--

CREATE TABLE `productos_backup` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `talla` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estilo_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos_backup`
--

INSERT INTO `productos_backup` (`id`, `marca`, `modelo`, `talla`, `color`, `categoria_id`, `estilo_id`, `precio`, `stock`) VALUES
('PROD-AD-002', 'Adidas', 'Zamba', '38', 'Blanco', 'CAT-DEP-001', 'EST-DEP-001', 1750.00, 25),
('PROD-FR-001', 'Fila', 'Ray', '39', '0', 'CAT-DEP-001', 'EST-DEP-001', 2225.00, 25),
('PROD-NI-003', 'Nike', 'Zoom', '36', 'Negro', 'CAT-DEP-001', 'EST-DEP-001', 1450.00, 25),
('PROD-SZ-001', 'SZX', 'ZzZ23', '23', '0', 'CAT-DEP-001', 'EST-DEP-001', 23232.00, 32);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Administrador','Gerente','Vendedor') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', 'admin123', ''),
(2, 'gerente', 'geren123', 'Gerente'),
(4, 'Vendedor1', 'vend123', 'Vendedor'),
(5, 'Vendedor2', 'vend456', 'Vendedor'),
(7, 'Jorge', 'Lulo2025', '');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `codigos_promocionales`
--
ALTER TABLE `codigos_promocionales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cedula` (`cedula`);

--
-- Indices de la tabla `estilos`
--
ALTER TABLE `estilos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `factura_items`
--
ALTER TABLE `factura_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_factura` (`id_factura`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`),
  ADD KEY `estilo_id` (`estilo_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `factura_items`
--
ALTER TABLE `factura_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `factura_items`
--
ALTER TABLE `factura_items`
  ADD CONSTRAINT `factura_items_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `factura_items_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;