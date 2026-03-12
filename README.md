# 🛒 MontarAI Backend - API REST

API REST completa para ecommerce con integración Stripe, autenticación JWT, gestión de direcciones y panel de administración.

## 🚀 Características

- ✅ Autenticación JWT (registro, login, recuperación de contraseña)
- ✅ Verificación de email
- ✅ Gestión de direcciones de envío
- ✅ Integración completa con Stripe
- ✅ Webhooks de Stripe para confirmación de pagos
- ✅ Sistema de pedidos
- ✅ Dashboard de administración
- ✅ Envío de emails (SMTP)
- ✅ Seguridad con Helmet, CORS y validaciones
- ✅ Sistema de internacionalización (i18n) Español/Inglés
- ✅ Configuración de marca dinámica (reutilizable)

## 🌍 Internacionalización (i18n)

La API soporta múltiples idiomas automáticamente.

### Idiomas soportados
- **es** - Español
- **en** - Inglés (por defecto si no se especifica)

### Cómo especificar el idioma

**1. Query Parameter (prioridad alta):**
```bash
GET /api/products?lang=es
```

**2. Header Accept-Language (prioridad media):**
```bash
curl -H "Accept-Language: es-ES,es;q=0.9" http://api...
```

**3. Por defecto:** Inglés (en)

### Formato de respuesta

Todas las respuestas incluyen:
```json
{
  "key": "auth.error.account_not_found",
  "message": "Cuenta no encontrada",
  "lang": "es"
}
```

### Ejemplos

**Solicitud en español:**
```bash
curl http://localhost:3000/api/auth/me?lang=es \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "key": "auth.ok.login_success",
  "message": "Login exitoso",
  "lang": "es",
  "user": { ... }
}
```

**Solicitud en inglés:**
```bash
curl http://localhost:3000/api/auth/me?lang=en \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "key": "auth.ok.login_success",
  "message": "Login successful",
  "lang": "en",
  "user": { ... }
}
```

### Archivos de traducción

Las traducciones se encuentran en:
```
src/locales/
├── es.json    # Español
└── en.json    # Inglés
```

### Variables dinámicas

Puedes usar variables en las traducciones:
```json
// es.json
"reset_password.salute": "Hola {firstName},"

// Resultado: "Hola Juan,"
```

### Añadir nuevos idiomas

1. Crear archivo `src/locales/fr.json` (ejemplo: francés)
2. Añadir a `src/locales/index.js`
3. Listo, la API detectará automáticamente el idioma

## 🎨 Configuración de Marca (Reutilizable)

El backend es completamente reutilizable. Puedes configurar el nombre, colores y branding para cada proyecto sin modificar código.

### Variables de Entorno de Marca

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `APP_NAME` | Nombre corto de la app | `MontarAI` |
| `APP_URL` | URL principal | `https://montarai.com` |
| `APP_SUPPORT_EMAIL` | Email de soporte | `soporte@montarai.com` |
| `EMAIL_FROM_NAME` | Nombre remitente emails | `MontarAI` |
| `EMAIL_FROM_ADDRESS` | Email remitente | `noreply@montarai.com` |
| `APP_PRIMARY_COLOR` | Color principal (hex) | `#007bff` |
| `APP_LOGO_URL` | URL del logo | `https://.../logo.png` |
| `COMPANY_NAME` | Nombre de la empresa | `MontarAI SL` |
| `COMPANY_ADDRESS` | Dirección fiscal | `Calle Mayor 123, Madrid` |
| `COMPANY_PHONE` | Teléfono de contacto | `+34 912 345 678` |
| `COMPANY_CIF` | CIF/NIF de la empresa | `B12345678` |

### Redes Sociales (Opcionales)

Deja en blanco para ocultarlas:

```env
SOCIAL_FACEBOOK=https://facebook.com/montarai
SOCIAL_INSTAGRAM=https://instagram.com/montarai
SOCIAL_TWITTER=https://twitter.com/montarai
SOCIAL_LINKEDIN=https://linkedin.com/company/montarai
SOCIAL_YOUTUBE=
SOCIAL_TIKTOK=
SOCIAL_BLUESKY=
```

### URLs Legales (Opcionales)

```env
URL_TERMS=https://montarai.com/terminos
URL_PRIVACY=https://montarai.com/privacidad
URL_LEGAL=https://montarai.com/aviso-legal
URL_COOKIES=https://montarai.com/cookies
URL_CONTACT=https://montarai.com/contacto
```

### Ejemplo: Reusar en otro proyecto

**Archivo .env para "MiTienda":**
```env
APP_NAME=MiTienda
APP_URL=https://mitienda.com
EMAIL_FROM_NAME=MiTienda
EMAIL_FROM_ADDRESS=noreply@mitienda.com
APP_PRIMARY_COLOR=#ff5733

COMPANY_NAME=MiTienda SL
COMPANY_ADDRESS="Calle Comercio 456, Barcelona"
COMPANY_PHONE=+34 933 444 555

SOCIAL_FACEBOOK=https://facebook.com/mitienda
SOCIAL_INSTAGRAM=https://instagram.com/mitienda
SOCIAL_TWITTER=

URL_TERMS=https://mitienda.com/terminos
URL_PRIVACY=https://mitienda.com/privacidad
```

**Resultado:**
- Los emails mostrarán "MiTienda" en lugar de "MontarAI"
- Color principal naranja (#ff5733)
- Footer con dirección de Barcelona
- Solo Facebook e Instagram (Twitter oculto porque está vacío)
- Links legales apuntan a mitienda.com

### ¿Qué se personaliza automáticamente?

✅ **Emails:**
- Nombre del remitente
- Logo o nombre en header
- Color de botones y enlaces
- Footer con redes sociales (condicional)
- Información de la empresa
- Links legales (condicional)
- Textos con nombre de la app interpolado

✅ **Respuestas API:**
- Mensajes de error/éxito
- Validaciones
- Nombres de campos

✅ **Todo sin tocar código:**
Solo modificas el archivo `.env` y reinicias el servidor.

## 📋 Requisitos

- Node.js 16+
- MySQL 8+
- Cuenta de Stripe
- Cuenta de email (Gmail, SendGrid, etc.)

## 🛠️ Instalación

### 1. Clonar y instalar dependencias

```bash
git clone <repo>
cd montarai-backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

### 3. Crear base de datos MySQL

```bash
mysql -u root -p
CREATE DATABASE montarai_backend;
```

### 4. Sincronizar base de datos

```bash
npm run db:sync
```

### 5. Iniciar servidor

```bash
# Desarrollo con hot-reload
npm run dev

# Producción
npm start
```

## ⚙️ Configuración Stripe

### En el Dashboard de Stripe:

1. **Crear productos** en Products
2. **Configurar impuestos** en Tax settings
3. **Configurar webhook**:
   - Endpoint URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Obtener claves API** (test mode para desarrollo)

### Para desarrollo local con webhooks:

```bash
# Instalar ngrok (desde ngrok.com)
ngrok http 3000

# Copia la URL https de ngrok y configúrala en Stripe:
# https://xxxxx.ngrok.io/api/stripe/webhook
```

## 📚 Documentación API

Ver archivo [API.md](./API.md) para todos los endpoints disponibles.

## 🧪 Testing

### Crear usuario admin

```sql
-- En MySQL después de registrar un usuario
UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
```

### Flujo de compra de prueba

1. Registrarse: `POST /api/auth/register`
2. Verificar email (revisa tu correo o verifica manualmente en BD)
3. Login: `POST /api/auth/login`
4. Crear dirección: `POST /api/addresses`
5. Ver productos: `GET /api/products`
6. Crear PaymentIntent: `POST /api/checkout/payment-intent`
7. En frontend, usar Stripe Elements con el `clientSecret`
8. El webhook creará automáticamente el pedido

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Validación de inputs con express-validator
- Headers de seguridad con Helmet
- Protección CORS configurada
- Rate limiting recomendado para producción

## 📦 Estructura del Proyecto

```
src/
├── config/          # Configuraciones
├── controllers/     # Lógica de endpoints
├── middleware/      # Auth y validaciones
├── models/          # Modelos Sequelize
├── routes/          # Definición de rutas
├── services/        # Email
├── utils/           # Helpers
└── app.js           # Entry point
```

## 📚 API Endpoints

Base URL: `http://localhost:3000/api`

### 🔐 Autenticación

Todos los endpoints protegidos requieren header:
```
Authorization: Bearer <access_token>
```

#### Flujo de Autenticación con Refresh Tokens

El sistema utiliza ** JWT con Refresh Tokens ** para una autenticación segura:

** Tokens: **
- ** Access Token **: Válido por 15 minutos. Se usa en el header `Authorization` para todas las peticiones API.
- ** Refresh Token **: Válido por 30 días. Se usa solo para obtener nuevos access tokens.

** Flujo: **

1. ** Login ** → Recibes `accessToken` + `refreshToken`
2. ** API Calls ** → Usa `accessToken` en el header
3. ** Token expirado(401) ** → Llama a `/auth/refresh-token` con el `refreshToken`
4. ** Recibir nuevos tokens ** → Actualiza el storage y reintenta la petición
5. ** Logout ** → Invalida el refresh token

** Características de seguridad: **
- ** Rotación de tokens **: Cada renovación genera nuevos access + refresh tokens
- ** Logout global **: Posibilidad de cerrar sesión en todos los dispositivos
- ** Invalidación server - side **: Los refresh tokens se guardan en la base de datos

** Implementación Frontend (Opción 1 - Axios): **

```javascript
// Almacenar tokens después del login
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('expiresAt', Date.now() + response.expiresIn * 1000);

// Interceptor para renovación automática
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken
        });
        
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('expiresAt', Date.now() + response.data.expiresIn * 1000);
        
        originalRequest.headers['Authorization'] = 'Bearer ' + response.data.accessToken;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh falló - redirigir a login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

** Implementación Frontend (Opción 2 - Fetch API nativo): **

```javascript
// Login con fetch
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expiresAt', Date.now() + data.expiresIn * 1000);
    return data;
  }
  
  throw new Error(data.message);
};

// Función fetch con renovación automática de tokens
const fetchWithAuth = async (url, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  let response = await fetch(url, config);
  
  // Si token expiró (401), intentar renovar
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Reintentar con nuevo token
      config.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, config);
    } else {
      // Refresh falló, redirigir a login
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  
  return response;
};

// Función para renovar el access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('expiresAt', Date.now() + data.expiresIn * 1000);
      return data.accessToken;
    }
  } catch (error) {
    console.error('Refresh failed:', error);
  }
  
  return null;
};

// Ejemplos de uso:

// Obtener perfil del usuario
const getProfile = async () => {
  const response = await fetchWithAuth('/api/auth/me');
  return await response.json();
};

// Actualizar perfil
const updateProfile = async (profileData) => {
  const response = await fetchWithAuth('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
  return await response.json();
};

// Cerrar sesión
const logout = async () => {
  await fetchWithAuth('/api/auth/logout', { method: 'POST' });
  localStorage.clear();
  window.location.href = '/login';
};

// Cerrar sesión en todos los dispositivos
const logoutAllDevices = async () => {
  await fetchWithAuth('/api/auth/logout-all-devices', { method: 'POST' });
  localStorage.clear();
  window.location.href = '/login';
};
```

#### POST /auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "García",
  "phone": "+34600123456"
}
```

**Response:**
```json
{
  "message": "Usuario registrado. Por favor verifica tu email.",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "García"
  }
}
```

#### POST /auth/login
Inicia sesión y devuelve access token y refresh token.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "role": "customer"
  }
}
```

#### POST /auth/refresh-token
Renueva el access token usando el refresh token. Implementa rotación de tokens (nuevo refresh token en cada renovación).

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errores:**
- `401`: Token inválido, expirado o sesión cerrada en todos los dispositivos

#### POST /auth/logout (Requiere Auth)
Cierra la sesión actual invalidando el refresh token.

**Response:**
```json
{
  "key": "auth.ok.logout_success",
  "message": "Sesión cerrada correctamente",
  "lang": "es"
}
```

#### POST /auth/logout-all-devices (Requiere Auth)
Cierra la sesión en todos los dispositivos incrementando el tokenVersion. Todos los refresh tokens existentes quedan invalidados.

**Response:**
```json
{
  "key": "auth.ok.logout_all_success",
  "message": "Sesión cerrada en todos los dispositivos",
  "lang": "es"
}
```

#### GET /auth/me (Requiere Auth)
Obtiene información del usuario autenticado.

#### POST /auth/change-password (Requiere Auth)
Cambia la contraseña del usuario.

**Body:**
```json
{
  "currentPassword": "password_actual",
  "newPassword": "nueva_password123"
}
```

#### PUT /auth/profile (Requiere Auth)
Actualiza el perfil del usuario.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "phone": "+34600123456"
}
```

### 📍 Direcciones (Requiere Auth)

#### GET /addresses
Lista todas las direcciones del usuario.

#### POST /addresses
Crea una nueva dirección.

**Body:**
```json
{
  "street": "Calle Mayor",
  "number": "123",
  "city": "Madrid",
  "postalCode": "28001",
  "province": "Madrid",
  "isDefault": true
}
```

#### PUT /addresses/:id
Actualiza una dirección.

#### DELETE /addresses/:id
Elimina una dirección.

### 📦 Pedidos (Requiere Auth)

#### GET /orders
Lista los pedidos del usuario.

#### GET /orders/:id
Obtiene detalles de un pedido específico.

#### POST /orders/:id/request-refund
Solicita una devolución.

**Body:**
```json
{
  "reason": "Producto defectuoso"
}
```

### 💳 Stripe

#### GET /products
Lista todos los productos con paginación.

**Query params:**
- `limit`: Número de productos (default: 10, max: 100)
- `starting_after`: ID del último producto de la página anterior

**Ejemplo:**
```
GET /api/products?limit=20&starting_after=prod_123
```

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "has_more": true,
    "total_count": 150,
    "next_page": "prod_last_id"
  }
}
```

#### POST /checkout/payment-intent (Requiere Auth)
Crea un PaymentIntent para el checkout.

**Body:**
```json
{
  "items": [
    {
      "priceId": "price_123456",
      "quantity": 2
    }
  ],
  "shippingAddressId": "uuid-direccion"
}
```

### 👨‍💼 Admin (Requiere Auth + Rol Admin)

#### GET /admin/dashboard
Estadísticas del dashboard.

#### GET /admin/orders
Lista todos los pedidos con filtros.

**Query params:**
- `status`: Filtrar por estado
- `page`: Número de página
- `limit`: Items por página

#### PUT /admin/orders/:id
Actualiza estado del pedido.

**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "ABC123456"
}
```

#### GET /admin/customers
Lista todos los clientes.

#### PUT /admin/customers/:id/status
Cambia el estado de un usuario.

**Body:**
```json
{
  "status": "banned",
  "reason": "Comportamiento fraudulento"
}
```

#### GET /admin/refunds
Lista solicitudes de devolución pendientes.

#### POST /admin/refunds/:orderId/approve
Aprueba y procesa una devolución.

#### POST /admin/refunds/:orderId/reject
Rechaza una solicitud de devolución.

**Body:**
```json
{
  "reason": "No cumple política de devoluciones"
}
```

### 📧 Newsletter

#### POST /newsletters/subscribe
Suscribe un email al newsletter (JWT opcional).

**Body (sin auth):**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Body (con auth):**
```json
{}
```

#### POST /newsletters/unsubscribe
Desuscribe un email del newsletter (JWT opcional).

**Body (sin auth):**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Body (con auth):**
```json
{}
```

#### POST /newsletters/send
Envía newsletter a suscriptores (solo admin).

**Body:**
```json
{
  "subject": "Ofertas de verano",
  "content": "<h1>Hola!</h1><p>Contenido...</p>",
  "testEmail": "prueba@ejemplo.com"
}
```

### 📊 Códigos de Error

- `200`: OK - Petición exitosa
- `201`: Created - Recurso creado
- `400`: Bad Request - Datos inválidos
- `401`: Unauthorized - No autenticado
- `403`: Forbidden - No autorizado
- `404`: Not Found - Recurso no encontrado
- `500`: Internal Server Error - Error del servidor

## 🚀 Despliegue en Servidor Propio (Debian + Apache)

### Requisitos Previos
- Servidor Debian con acceso root
- Apache2 instalado y funcionando
- MySQL Server instalado
- Dominio configurado apuntando a la IP del servidor
- Git instalado

### 1. Instalar Node.js y PM2

```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar PM2 globalmente
npm install -g pm2
```

### 2. Preparar la Aplicación

```bash
# Crear directorio
mkdir -p /var/www/montarai-backend
cd /var/www/montarai-backend

# Clonar repositorio
git clone <tu-repositorio-git> .

# Instalar dependencias
npm install --production

# Crear carpeta para logs
mkdir -p logs
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

**Editar con valores de PRODUCCIÓN:**
```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=montarai_user
DB_PASSWORD=tu_password_seguro_aqui
DB_NAME=montarai_backend_prod

JWT_SECRET=genera_un_secreto_largo_y_aleatorio_de_64_caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
REFRESH_TOKEN_SECRET=otro_secreto_diferente_para_refresh_tokens

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@tudominio.com

STRIPE_SECRET_KEY=sk_live_tu_clave_real_aqui
STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_real_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_secreto_webhook
```

### 4. Crear Base de Datos MySQL

```bash
mysql -u root -p
```

```sql
CREATE DATABASE montarai_backend_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'montarai_user'@'localhost' IDENTIFIED BY 'tu_password_seguro_aqui';
GRANT ALL PRIVILEGES ON montarai_backend_prod.* TO 'montarai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Sincronizar tablas
npm run db:sync
```

### 5. Configurar PM2

Iniciar aplicación:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

### 6. Configurar Apache como Reverse Proxy

Crear archivo de configuración:
```bash
nano /etc/apache2/sites-available/montarai-api.conf
```

**Contenido:**
```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    ErrorLog ${APACHE_LOG_DIR}/montarai-error.log
    CustomLog ${APACHE_LOG_DIR}/montarai-access.log combined
</VirtualHost>
```

Habilitar configuración:
```bash
a2ensite montarai-api.conf
a2enmod proxy
a2enmod proxy_http
a2enmod headers
systemctl restart apache2
```

### 7. Configurar SSL con Let's Encrypt

```bash
apt-get update
apt-get install certbot python3-certbot-apache
certbot --apache -d tu-dominio.com -d www.tu-dominio.com
```

### 8. Backup Automático de Base de Datos

Crear script de backup:
```bash
mkdir -p /var/backups/mysql
nano /usr/local/bin/backup-mysql.sh
```

**Contenido:**
```bash
#!/bin/bash
DB_NAME="montarai_backend_prod"
DB_USER="montarai_user"
DB_PASS="tu_password_seguro_aqui"
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "[$(date)] Backup completado" >> /var/log/mysql-backup.log
```

Hacer ejecutable y programar:
```bash
chmod +x /usr/local/bin/backup-mysql.sh
crontab -e

# Añadir línea (backup diario a las 3:00 AM):
0 3 * * * /usr/local/bin/backup-mysql.sh
```

### 9. Configurar Stripe para Producción

1. En el Dashboard de Stripe, cambiar a **MODO LIVE**
2. Obtener claves API de producción
3. Configurar webhook:
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 10. Comandos de Mantenimiento

```bash
# Ver estado de la API
pm2 status

# Ver logs en tiempo real
pm2 logs montarai-api

# Reiniciar API
pm2 restart montarai-api

# Actualizar código
cd /var/www/montarai-backend
git pull
npm install --production
pm2 restart montarai-api

# Ver backups
ls -la /var/backups/mysql/
```

### 📋 Checklist de Despliegue

- [ ] Node.js y PM2 instalados
- [ ] Código clonado en `/var/www/montarai-backend`
- [ ] Archivo `.env` configurado con valores de producción
- [ ] Base de datos MySQL creada y sincronizada
- [ ] PM2 ejecutando la aplicación
- [ ] Apache configurado como reverse proxy
- [ ] SSL configurado con Let's Encrypt
- [ ] Backup automático programado
- [ ] Stripe en modo LIVE con webhook configurado
- [ ] Prueba de registro/login funcionando
- [ ] Prueba de compra con tarjeta de prueba Stripe

## 📝 TODO

Ver [TODO.md](./TODO.md) para lista de tareas pendientes y completadas.

## 🤝 Contribuir

1. Fork del proyecto
2. Crea tu branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### ¿Qué significa esto?

- ✅ Puedes usar, modificar y distribuir este software libremente
- ✅ Uso comercial permitido
- ⚠️ Si modificas el código y lo usas en un servidor web, debes publicar esas modificaciones
- ⚠️ Cualquier trabajo derivado debe usar la misma licencia AGPL-3.0
- ℹ️ Ver archivo [LICENSE](./LICENSE) para el texto completo

Para más información sobre la AGPL-3.0, visita: https://www.gnu.org/licenses/agpl-3.0.html

---

<p align="center">Hecho con ❤️ y ☕</p>
