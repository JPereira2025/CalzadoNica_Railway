const jwt = require("jsonwebtoken");

describe("JWT", () => {

    test("Debe generar token con id, username y role", () => {

        const payload = {
            id: 1,
            username: "admin",
            role: "Administrador"
        };

        const token = jwt.sign(
            payload,
            "secreto_prueba"
        );

        const decoded = jwt.verify(
            token,
            "secreto_prueba"
        );

        expect(decoded.id).toBe(1);
        expect(decoded.username).toBe("admin");
        expect(decoded.role).toBe("Administrador");

    });

});