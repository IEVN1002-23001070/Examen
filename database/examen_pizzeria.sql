-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 08, 2026 at 07:43 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `examen_pizzeria`
--

-- --------------------------------------------------------

--
-- Table structure for table `detalle_ventas`
--

CREATE TABLE `detalle_ventas` (
  `iddetalle` int UNSIGNED NOT NULL,
  `idventa` int UNSIGNED NOT NULL,
  `tamano` varchar(12) NOT NULL,
  `ingredientes` varchar(100) NOT NULL DEFAULT '',
  `cantidad` int UNSIGNED NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `detalle_ventas`
--

INSERT INTO `detalle_ventas` (`iddetalle`, `idventa`, `tamano`, `ingredientes`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 'mediana', 'Jamón, Piña', 2, 100.00, 200.00),
(2, 2, 'mediana', 'Jamón, Piña', 5, 100.00, 500.00),
(3, 3, 'mediana', 'Jamón, Piña, Champiñones', 1, 110.00, 110.00),
(4, 4, 'grande', 'Jamón, Piña, Champiñones', 1, 150.00, 150.00),
(5, 5, 'chica', 'Jamón, Piña, Champiñones', 1, 70.00, 70.00),
(6, 6, 'mediana', '', 1, 80.00, 80.00),
(7, 7, 'mediana', '', 1, 80.00, 80.00);

-- --------------------------------------------------------

--
-- Table structure for table `ventas`
--

CREATE TABLE `ventas` (
  `idventa` int UNSIGNED NOT NULL,
  `nombre_cliente` varchar(120) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `telefono` varchar(25) NOT NULL,
  `fecha_pedido` date NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `registrado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ventas`
--

INSERT INTO `ventas` (`idventa`, `nombre_cliente`, `direccion`, `telefono`, `fecha_pedido`, `total`, `registrado_en`) VALUES
(1, 'Cliente de prueba', 'Calle Prueba 123', '4770000000', '2026-11-07', 200.00, '2026-11-08 05:44:56'),
(2, 'yo', 'se5', '344564323455', '2026-11-01', 500.00, '2026-11-08 06:35:31'),
(3, 'SELE', 'RRRRR', '44444444434', '2026-11-08', 110.00, '2026-11-08 06:47:50'),
(4, 'DANNA', 'LLLL', '7888645241', '2026-11-02', 150.00, '2026-11-08 06:50:11'),
(5, 'ALE', 'VVV', '3887208171', '2015-01-08', 70.00, '2026-11-08 06:56:05'),
(6, 'JAZ', 'EEEE', '2334527765', '2026-11-08', 80.00, '2026-11-08 07:03:28'),
(7, 'ZURI', 'JJJ', '7116254131', '2024-02-20', 80.00, '2026-11-08 07:05:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD PRIMARY KEY (`iddetalle`),
  ADD KEY `idx_idventa` (`idventa`);

--
-- Indexes for table `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`idventa`),
  ADD KEY `idx_fecha_pedido` (`fecha_pedido`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  MODIFY `iddetalle` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `ventas`
--
ALTER TABLE `ventas`
  MODIFY `idventa` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD CONSTRAINT `fk_detalle_ventas_venta` FOREIGN KEY (`idventa`) REFERENCES `ventas` (`idventa`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
