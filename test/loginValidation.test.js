describe("Validación Login", () => {

    test("Username vacío", () => {

        const username = "";
        const password = "123456";

        expect(!username || !password)
            .toBe(true);

    });

    test("Password vacío", () => {

        const username = "admin";
        const password = "";

        expect(!username || !password)
            .toBe(true);

    });

});