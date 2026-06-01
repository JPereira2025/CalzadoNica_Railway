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
Cree un archivo `.env` en la raíz con el siguiente contenido:
```env
JWT_SECRET=tu_secreto_super_seguro
PORT=3001
HOST=0.0.0.0
```

### 4. Ejecución

**Modo Desarrollo:**
```powershell
npm run dev:api
```

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
