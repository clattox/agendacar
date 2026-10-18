# Deploy en Hostinger

## Requisitos previos
- Plan Hostinger con Node.js activo
- Acceso a hPanel y al File Manager
- Base de datos MySQL creada en hPanel

---

## 1. Base de datos MySQL

En hPanel → Databases → MySQL Databases:
1. Crear base de datos: `agendacar`
2. Crear usuario y asignarle todos los permisos
3. Anotar: host, nombre de BD, usuario y contraseña

---

## 2. Subir el código

En hPanel → Git → clonar el repo en el directorio del hosting:
```
https://github.com/clattox/agendacar
```

O subir manualmente via File Manager a `public_html/agendacar/`

---

## 3. Configurar variables de entorno del server

Crear el archivo `server/.env` con:
```env
DATABASE_URL="mysql://usuario:password@localhost:3306/agendacar"
JWT_SECRET="genera_una_clave_larga_y_aleatoria_aqui"
PORT=3001
CLIENT_URL="https://tusubdominio.hostingersite.com"

MAIL_HOST="smtp.hostinger.com"
MAIL_PORT=465
MAIL_USER="notificaciones@tudominio.cl"
MAIL_PASS="tu_password_de_correo"
```

---

## 4. Instalar dependencias y migrar BD

En la terminal de Hostinger (SSH o terminal de hPanel):
```bash
cd agendacar/server
npm install
npx prisma db push
npm run db:seed
```

El seed crea el tenant demo, los servicios y el usuario admin.

---

## 5. Configurar Node.js en hPanel

En hPanel → Node.js:
1. Seleccionar versión: **18.x o superior**
2. Application root: `agendacar/server`
3. Application startup file: `index.js`
4. Clic en **Create** y luego **Run**

---

## 6. Build del frontend

```bash
cd agendacar/client
npm install
npm run build
```

Esto genera la carpeta `dist/`.

---

## 7. Servir el frontend

Copiar el contenido de `client/dist/` a `public_html/` (o al directorio raíz del subdominio).

En el archivo `.htaccess` agregar para que funcione React Router:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 8. Variable de entorno del frontend

Crear `client/.env.production`:
```env
VITE_API_URL=https://tusubdominio.hostingersite.com/api
```

Y volver a hacer el build:
```bash
npm run build
```

---

## Resumen de URLs

| Recurso | URL |
|---------|-----|
| Página pública | `https://tusubdominio.hostingersite.com` |
| Panel admin | `https://tusubdominio.hostingersite.com/admin/login` |
| API | `https://tusubdominio.hostingersite.com/api` |

---

## Credenciales del seed (cambiar después)

| Campo | Valor |
|-------|-------|
| Email | admin@demo.cl |
| Contraseña | admin1234 |

**Importante:** cambiar la contraseña del admin después del primer login.
