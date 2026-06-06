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