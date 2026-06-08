SET FOREIGN_KEY_CHECKS=0;
INSERT INTO usuarios (id, username, password, role, email, verified, verification_token, verification_token_expiry) VALUES
(1, 'admin', 'REDACTED', NULL, NULL, 0, NULL, NULL),
(2, 'gerente', 'REDACTED', 'Gerente', NULL, 0, NULL, NULL),
(4, 'Vendedor1', 'REDACTED', 'Vendedor', NULL, 0, NULL, NULL),
(5, 'Vendedor2', 'REDACTED', 'Vendedor', NULL, 0, NULL, NULL),
(7, 'Jorge', 'REDACTED', NULL, NULL, 0, NULL, NULL);
SET FOREIGN_KEY_CHECKS=1;