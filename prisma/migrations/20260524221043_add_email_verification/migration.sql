-- CreateTable
CREATE TABLE `categorias` (
    `id` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `nombre`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigos_promocionales` (
    `id` VARCHAR(20) NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `porcentaje_descuento` INTEGER NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_fin` DATE NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id` VARCHAR(20) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `sueldo` DECIMAL(10, 2) NOT NULL,
    `nacimiento` DATE NOT NULL,
    `cedula` VARCHAR(20) NOT NULL,
    `sexo` ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
    `estado_civil` VARCHAR(50) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `direccion` TEXT NOT NULL,
    `cargo` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `cedula`(`cedula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estilos` (
    `id` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `nombre`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `factura_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_factura` VARCHAR(20) NOT NULL,
    `id_producto` VARCHAR(50) NOT NULL,
    `nombre_producto` VARCHAR(255) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,

    INDEX `id_factura`(`id_factura`),
    INDEX `id_producto`(`id_producto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` VARCHAR(20) NOT NULL,
    `cliente` VARCHAR(255) NOT NULL,
    `vendedor` VARCHAR(50) NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `monto_descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `iva` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `codigo_descuento` VARCHAR(50) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` VARCHAR(50) NOT NULL,
    `marca` VARCHAR(100) NOT NULL,
    `modelo` VARCHAR(100) NOT NULL,
    `talla` VARCHAR(10) NOT NULL,
    `color` VARCHAR(255) NULL,
    `categoria_id` VARCHAR(20) NULL,
    `estilo_id` VARCHAR(20) NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL,

    INDEX `categoria_id`(`categoria_id`),
    INDEX `estilo_id`(`estilo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos_backup` (
    `id` VARCHAR(50) NOT NULL,
    `marca` VARCHAR(100) NOT NULL,
    `modelo` VARCHAR(100) NOT NULL,
    `talla` VARCHAR(10) NOT NULL,
    `color` VARCHAR(255) NULL,
    `categoria_id` VARCHAR(20) NULL,
    `estilo_id` VARCHAR(20) NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('Administrador', 'Gerente', 'Vendedor') NOT NULL,
    `email` VARCHAR(255) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verification_token` VARCHAR(100) NULL,
    `verification_token_expiry` DATETIME(0) NULL,

    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `factura_items` ADD CONSTRAINT `factura_items_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `factura_items` ADD CONSTRAINT `factura_items_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
