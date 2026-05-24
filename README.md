# Sistema Calzado Nica

## Descripción

Sistema de gestión para tienda de calzado. La interfaz principal está en `index.html` y el backend actual se ejecuta desde `src/server.js`.

## Requisitos

- Node.js
- MySQL / MariaDB
- XAMPP u otro servidor local para la base de datos

## Configuración de la base de datos

1. Inicie MySQL.
2. Importe el archivo SQL de la base de datos:
   - `db/init.sql`

> El backend Node utiliza la base de datos `calzado_nica`.

## Uso con XAMPP (frontend)

1. Copie la carpeta `CalzadoNica` a `xampp/htdocs`.
2. En el panel de control de XAMPP, inicie **Apache** y **MySQL**.
3. Abra en el navegador:
   - `http://localhost/CalzadoNica/index.html`

## Servidor Node.js

1. Instale dependencias:
   ```powershell
   npm install
   ```
2. Cree un archivo `.env` en la raíz si desea personalizar variables:
   ```env
   JWT_SECRET=change_this_secret
   PORT=3001
   HOST=0.0.0.0
   ```
3. Inicie el servidor:
   - Producción/local: `npm run start:api`
   - Desarrollo con recarga: `npm run dev:api`

## Compilar Tailwind CSS (opcional)

```powershell
npm run build:css
```

Para modo observador:

```powershell
npm run watch:css
```

## Archivos importantes

- `index.html`: página principal del sistema.
- `script.js`: lógica principal del frontend.
- `js/`: scripts de frontend.
- `src/`: backend Node.js y lógica de la API.
- `db/init.sql`: script de creación de base de datos.

## Notas adicionales

- El backend actual no depende de PHP.
- Si Apache no carga la página, verifique que no haya otro servicio usando el puerto `80`.
- El servidor Node.js escucha en `http://localhost:3001` por defecto.
