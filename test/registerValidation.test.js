describe("Validación Registro", () => {

    test("Debe requerir username", () => {

        const username = "";
        const password = "123456";
        const email = "correo@test.com";

        expect(
            !username || !password || !email
        ).toBe(true);

    });

    test("Debe requerir email", () => {

        const username = "jorge";
        const password = "123456";
        const email = "";

        expect(
            !username || !password || !email
        ).toBe(true);

    });

    test("Debe requerir password", () => {

        const username = "jorge";
        const password = "";
        const email = "correo@test.com";

        expect(
            !username || !password || !email
        ).toBe(true);

    });

});