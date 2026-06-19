const authenticateToken = require("../src/middlewares/authMiddleware");

describe("Middleware Auth", () => {

    test("Debe rechazar cuando no existe token", () => {

        const req = {
            headers: {}
        };

        const next = jest.fn();

        authenticateToken(req, {}, next);

        expect(next).toHaveBeenCalledWith({
            status: 401,
            message: "Token no proporcionado"
        });

    });

});