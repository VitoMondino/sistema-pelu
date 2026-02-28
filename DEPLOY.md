# Despliegue a Producción — Render (backend + DB) y Netlify (frontend)

Resumen: este documento contiene los pasos para provisionar una base de datos MySQL en Render, exportar/importar tus datos, desplegar el `backend` en Render (usando el `Dockerfile` ya añadido) y desplegar el `frontend` en Netlify.

---

Requisitos locales
- Tener `git` configurado y el proyecto subido a un repositorio (GitHub es lo más sencillo).
- Tener acceso a la consola donde corre tu MySQL local para exportar el dump (`mysqldump`).

1) Provisionar MySQL en Render
- Entra en https://render.com y crea una cuenta/organización.
- En el panel, selecciona "Databases" → "New Database" → elige MySQL (Managed MySQL).
- Elige plan, nombre y región.
- Cuando la instancia se cree, anota: `HOST`, `PORT`, `DATABASE`, `USER`, `PASSWORD`.

2) Exportar tu base de datos local
- Desde tu máquina donde está la BD actualmente ejecuta:

```bash
mysqldump -u TU_USER -p TU_DB > peluqueria_dump.sql
```

3) Importar hacia Render
- Si Render permite conexiones públicas desde tu IP, puedes importar directo:

```bash
mysql -h PROD_HOST -P PROD_PORT -u PROD_USER -p PROD_DB < peluqueria_dump.sql
```

- Si Render no permite import directo, sube `peluqueria_dump.sql` a un droplet temporal o a tu máquina y usa el cliente del proveedor, o usa su panel/CLI si ofrecen import.

4) Preparar variables de entorno
- En Render (servicio web del backend) configura estas env vars (Environment):
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET` (valor seguro)
  - `NODE_ENV=production`

5) Desplegar backend en Render
- Opción A (más simple): Conectar tu repositorio GitHub a Render y crear un nuevo "Web Service".
  - Tipo: Docker (Render detectará el `Dockerfile`) o Node (si no usas Docker).
  - Build command: (si usas Node sin Docker) `npm ci && npm run build` (si aplica).
  - Start command: `npm start` o dejar que Render use `CMD` del `Dockerfile`.
  - Add the Environment variables (ver sección 4).
  - Deploy on push: habilita auto-deploy.

6) Desplegar frontend en Netlify
- En Netlify: conecta tu repositorio GitHub → New site from Git.
- Build command: `npm ci && npm run build`
- Publish directory: `build`
- Si tu frontend usa la URL de la API, configura:
  - `REACT_APP_API_URL` = `https://tu-dominio-backend` (o usar runtime config)

7) Configurar DNS y HTTPS
- Añade tu dominio en Netlify (frontend) y Render (backend si usas Custom Domain). Netlify y Render proveen certificados Let's Encrypt automáticos.

8) Exportar/importar sensibilidad: secretos y seguridad
- Nunca subas `.env` al repo.
- Usa los secretos del proveedor (Render/Netlify/GitHub Secrets) para credenciales.

Comandos útiles
- Build frontend localmente:

```bash
cd frontend
npm ci
npm run build
```

- Ejecutar backend local (usando variables locales):

```bash
cd backend
npm ci
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=tu_password
set DB_NAME=peluqueria_db
npm start
```

Pruebas y verificación
- Verifica endpoints con Postman o curl apuntando a la URL de Render.
- Revisa logs en Render (panel) si algo falla.

Siguientes pasos opcionales
- Crear GitHub Actions para ejecutar tests y builds antes del deploy.
- Configurar backups automáticos en Render y comprobar restores periódicos.
- Configurar monitoreo (Sentry / Datadog) y alertas.

Notas
- `backend/config.js` ya lee variables de entorno; asegúrate de configurar `DB_*` y `JWT_SECRET` en Render.
- Si quieres, puedo generar un `workflow` de GitHub Actions para pruebas y build antes de push o ayudarte a conectar el repo con Render/Netlify.
