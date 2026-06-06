SET FOREIGN_KEY_CHECKS=0;
INSERT INTO usuarios (id, username, password, role, email, verified, verification_token, verification_token_expiry) VALUES
(1, 'admin', 'admin123', NULL, NULL, 0, NULL, NULL),
(2, 'gerente', 'geren123', 'Gerente', NULL, 0, NULL, NULL),
(4, 'Vendedor1', 'vend123', 'Vendedor', NULL, 0, NULL, NULL),
(5, 'Vendedor2', 'vend456', 'Vendedor', NULL, 0, NULL, NULL),
(7, 'Jorge', 'Lulo2025', NULL, NULL, 0, NULL, NULL);
SET FOREIGN_KEY_CHECKS=1;