# Sistema Calzado Nica

## Descripción

Sistema de gestión para tienda de calzado. La interfaz principal está en `index.html` y el backend actual se ejecuta desde `src/server.js`.

## Estructura del Proyecto (Arquitectura Modular Express)

El backend está organizado siguiendo el patrón MVC y diseño modular:

- `src/server.js`: Punto de entrada del servidor.
- `src/app.js`: Configuración de Express, middlewares globales y prefijos de rutas.
- `src/routes/`: Definición de rutas divididas por módulos (auth, productos, etc.).
- `src/controllers/`: Lógica de control para cada endpoint.
- `src/middlewares/`: Protección de rutas y validación de esquemas (Middleware de Auth).

---

## ⚙️ Configuración e Instalación

### 1. Base de Datos
1. Inicie el servicio **MySQL** desde XAMPP.
2. Importe el archivo `db/init.sql` para crear la estructura de `calzado_nica`.

### 2. Instalación de Dependencias
```powershell
npm install
```

### 3. Variables de Entorno
Use `.env.example` como plantilla. Copie el archivo y cree su `.env` localmente (no subir `.env` al repositorio):

```bash
cp .env.example .env
# editar .env y completar valores secretos
```

Variables clave (ejemplos):

```env
JWT_SECRET=tu_secreto_super_seguro
PORT=3001
HOST=0.0.0.0
DATABASE_URL="mysql://root:password@127.0.0.1:3306/calzado_nica"
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com
```

Importante: nunca subas el archivo `.env` con credenciales. Usa `.env.example` para documentar las variables requeridas.

### 4. Ejecución

**Modo Desarrollo:**
```powershell
npm run dev:api
```
en railway SELECT * FROM usuarios WHERE username='';
select * FROM usuarios where id= ;
Reenvio de Token en PS
curl -s -X POST http://localhost:3001/resend-token -H "Content-Type: application/json" -d '{"usernameOrEmail":"mierdil2019@gmail.com"}' -i

intentar login con credenciales (verás la respuesta JSON / status):
curl -s -X POST http://localhost:3001/login -H "Content-Type: application/json" -d '{"username":"JGuadamuz","password":"contraseña_incorrecta"}' -i


  -

**Ejecución local (PostgreSQL / Prisma)**

Si usas `DATABASE_URL` de PostgreSQL (por ejemplo Railway) sigue estos pasos antes de iniciar el servidor:

```bash
cp .env.example .env
# Edita .env y pega tu DATABASE_URL (no subir .env al repo)
npm install
npx prisma generate
npx prisma db push
# Iniciar en modo desarrollo (con recarga automática):
npm run dev:api
# O iniciar una sola vez:
npm run start:api
```

Si la base de datos es remota (Railway), asegúrate de tener la `DATABASE_URL` correcta y las variables `JWT_SECRET`, `EMAIL_*` en tu `.env` local o en las variables del servicio.

### Rutas de entrada (URLs)

- **Webapp (XAMPP/htdocs):** http://localhost/CalzadoNica/  — ejemplo: "Sistema Calzado Nica - v2.6 (Final)"
- **API / servidor de desarrollo (Node/Express):** http://localhost:3001/  — si ves "Cannot GET /" arranca el servidor con `npm run dev:api`.
- **Tienda pública (archivos estáticos):** http://localhost:3001/tienda/  — contenido en `public/tienda/`.

> Nota: si colocaste la carpeta del proyecto en `htdocs` (XAMPP), la webapp se sirve en `http://localhost/CalzadoNica/`. Cuando el servidor Node está activo en el puerto `3001`, la API y la tienda estarán disponibles en `http://localhost:3001/` y `http://localhost:3001/tienda/` respectivamente.

---

## 🎨 Estilos y UI

El proyecto utiliza **Tailwind CSS**. Para realizar modificaciones en el diseño:

- **Compilar:** `npm run build:css`
- **Modo Observador:** `npm run watch:css`

## Nota de desarrollo (Windows)

Si en Windows al arrancar el servidor la consola muestra que el puerto está en uso, hay un script de ayuda que intenta liberar el puerto antes de iniciar el servidor de desarrollo.

- Script: `scripts/free_port_windows.ps1` — PowerShell que detecta procesos escuchando en un puerto (por defecto `3001`) y los termina. Está documentado y pensado solo para entornos de desarrollo en Windows.
- Comando integrado: `predev:api` en `package.json` ejecuta ese script antes de `dev:api`, por lo que al ejecutar `npm run dev:api` el puerto se intentará liberar automáticamente.

Ejemplo de uso manual (PowerShell):
```powershell
powershell -File scripts/free_port_windows.ps1 3001
```

Usar con precaución: el script termina procesos por PID que estén escuchando en el puerto indicado; está pensado para limpiar sesiones de `node` colgadas en desarrollo.

---

## Métodos HTTP básicos (GET, POST, PUT, DELETE)

Breve explicación y ejemplos prácticos para interactuar con la API de `CalzadoNica`.

- GET: recuperar datos (no modifica el servidor).

	Ejemplo — obtener todos los productos:

	```bash
	curl -s -X GET http://localhost:3001/api/productos
	```

- POST: crear un recurso (normalmente enviando JSON). Muchas rutas administrativas requieren un token JWT en `Authorization`.

	Ejemplo — crear un producto (requiere token de administrador):

	```bash
	curl -s -X POST http://localhost:3001/api/productos \
		-H "Authorization: Bearer <TOKEN_ADMIN>" \
		-H "Content-Type: application/json" \
		-d '{"id":"P-001","marca":"MiMarca","modelo":"Modelo1","talla":"42","precio":1200,"stock":10}'
	```

- PUT: actualizar un recurso existente; en esta API se envía el `id` y los campos a actualizar en el body.

	Ejemplo — actualizar precio y stock:

	```bash
	curl -s -X PUT http://localhost:3001/api/productos \
		-H "Authorization: Bearer <TOKEN_ADMIN>" \
		-H "Content-Type: application/json" \
		-d '{"id":"P-001","precio":1299.99,"stock":8}'
	```

- DELETE: eliminar un recurso; normalmente se pasa `id` en la query string.

	Ejemplo — eliminar producto:

	```bash
	curl -s -X DELETE "http://localhost:3001/api/productos?id=P-001" \
		-H "Authorization: Bearer <TOKEN_ADMIN>"
	```

Notas:
- Reemplaza `<TOKEN_ADMIN>` por un JWT obtenido con `/login` usando un usuario administrador.
- Muchas rutas públicas (por ejemplo `GET /api/productos`) no requieren autenticación.

Obtener lista de productos (GET)
curl -s -X GET http://localhost:3001/api/productos

Logearse y obtener el token (POST /login)
curl -s -X POST http://localhost:3001/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

Crear un producto (POST /api/productos)
curl -s -X POST http://localhost:3001/api/productos \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"id":"P-001","marca":"MiMarca","modelo":"Modelo1","talla":"42","precio":1200,"stock":10}'
  

  Actualizar producto (PUT /api/productos):
 curl -s -X PUT http://localhost:3001/api/productos \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"id":"P-001","precio":1299.99,"stock":8}'

   Eliminar producto (DELETE /api/productos?id=...):
   curl -s -X DELETE "http://localhost:3001/api/productos?id=P-001" \
  -H "Authorization: Bearer <TOKEN_ADMIN>"

Opción automática en PowerShell (intenta extraer el token a $token):
$resp = curl -s -X POST http://localhost:3001/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
$token = ($resp | ConvertFrom-Json).token
Write-Host "TOKEN:" $token
  

---

## Despliegue en Railway (opcional)

Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy-railway.yml`) que construye el proyecto y, si configuras las credenciales, intenta desplegar en Railway.

Pasos recomendados:

1. Crea un proyecto nuevo en Railway y añade una base de datos (Postgres o MySQL según prefieras).
2. Copia la `DATABASE_URL` que Railway te proporciona y pégala en las variables de entorno del proyecto en Railway.
3. En la configuración del repositorio en GitHub, añade los siguientes secretos en `Settings -> Secrets`:
	- `RAILWAY_API_KEY` — tu API key/token de Railway.
	- `RAILWAY_PROJECT_ID` — el ID del proyecto Railway (lo verás en la URL o en la configuración del proyecto).
4. Opcional: añade las variables de entorno necesarias en Railway (por ejemplo `JWT_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
5. Al hacer push a `main`, `master` o `version-6`, el workflow ejecutará la compilación; si detecta los secretos, ejecutará `npx @railway/cli up` para desplegar.

Notas de seguridad:

- Nunca subas tu `.env` al repositorio. Usa `.env.example` para documentar variables.
- Guarda tus secretos en GitHub Secrets y en Railway variables.

