# 📚 API Documentation - MontarAI Backend

## Base URL
```
http://localhost:3000/api
```

## Autenticación
La mayoría de endpoints requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 AUTH ENDPOINTS

### POST /auth/register
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

### POST /auth/login
Inicia sesión y devuelve token JWT.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

### GET /auth/me
Obtiene información del usuario autenticado.

### GET /auth/verify-email?token=<token>
Verifica el email del usuario.

### POST /auth/forgot-password
Solicita recuperación de contraseña.

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

### POST /auth/reset-password
Restablece la contraseña.

**Body:**
```json
{
  "token": "token_de_recuperacion",
  "password": "nueva_password123"
}
```

### POST /auth/change-password (Requiere Auth)
Cambia la contraseña del usuario logueado.

**Body:**
```json
{
  "currentPassword": "password_actual",
  "newPassword": "nueva_password123"
}
```

### PUT /auth/profile (Requiere Auth)
Actualiza el perfil del usuario.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "phone": "+34600123456"
}
```

### POST /auth/change-email (Requiere Auth)
Solicita cambio de email (envía verificación al nuevo email).

**Body:**
```json
{
  "newEmail": "nuevo@email.com",
  "password": "password_actual"
}
```

### GET /auth/verify-new-email?token=<token>
Confirma el cambio de email.

### POST /auth/deactivate (Requiere Auth)
Desactiva la cuenta del usuario.

**Body:**
```json
{
  "password": "password_actual"
}
```

---

## 📍 ADDRESSES ENDPOINTS (Requiere Auth)

### GET /addresses
Lista todas las direcciones del usuario.

### GET /addresses/:id
Obtiene una dirección específica.

### POST /addresses
Crea una nueva dirección.

**Body:**
```json
{
  "street": "Calle Mayor",
  "number": "123",
  "floor": "2",
  "door": "B",
  "city": "Madrid",
  "postalCode": "28001",
  "province": "Madrid",
  "country": "España",
  "isDefault": true
}
```

### PUT /addresses/:id
Actualiza una dirección.

### DELETE /addresses/:id
Elimina una dirección.

### PATCH /addresses/:id/default
Establece como dirección por defecto.

---

## 📦 ORDERS ENDPOINTS (Requiere Auth)

### GET /orders
Lista los pedidos del usuario.

### GET /orders/:id
Obtiene detalles de un pedido específico.

### POST /orders/:id/request-refund (Requiere Auth)
Solicita una devolución para el pedido.

**Body:**
```json
{
  "reason": "Producto defectuoso"
}
```

**Response:**
```json
{
  "message": "Solicitud de devolución enviada correctamente",
  "order": {
    "id": "uuid",
    "status": "refund_requested",
    "refundStatus": "requested"
  }
}
```

---

## 💳 STRIPE ENDPOINTS

### GET /products
Lista todos los productos desde Stripe con paginación cursor-based.

**Query params:**
- `limit`: Número de productos por página (default: 10, max: 100)
- `starting_after`: ID del último producto de la página anterior (para paginación hacia adelante)
- `ending_before`: ID del primer producto de la página anterior (para paginación hacia atrás)

**Ejemplo:**
```
GET /api/products?limit=20&starting_after=prod_123
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_xxx",
      "name": "Producto Ejemplo",
      "description": "Descripción del producto",
      "images": ["url_imagen"],
      "price": {
        "id": "price_xxx",
        "amount": 29.99,
        "currency": "eur"
      }
    }
  ],
  "pagination": {
    "has_more": true,
    "total_count": 150,
    "next_page": "prod_last_id",
    "previous_page": "prod_first_id",
    "current_limit": 20
  }
}
```

### GET /products/:id
Obtiene detalles de un producto.

### POST /checkout/payment-intent (Requiere Auth)
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

**Response:**
```json
{
  "clientSecret": "pi_123_secret_456",
  "paymentIntentId": "pi_123"
}
```

### POST /stripe/webhook
Webhook para recibir eventos de Stripe.

---

## 👨‍💼 ADMIN ENDPOINTS (Requiere Auth + Rol Admin)

### GET /admin/dashboard
Estadísticas del dashboard.

### GET /admin/orders
Lista todos los pedidos (con paginación y filtros).

**Query params:**
- `status`: filtrar por estado
- `page`: número de página
- `limit`: items por página

### GET /admin/orders/:id
Detalle completo de un pedido.

### PUT /admin/orders/:id
Actualiza estado del pedido.

**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "ABC123456"
}
```

### GET /admin/customers
Lista todos los clientes.

**Query params:**
- `status`: filtrar por estado (active, inactive, banned)
- `page`: número de página
- `limit`: items por página

### GET /admin/customers/:id
Obtiene detalles de un cliente específico con historial de pedidos.

### PUT /admin/customers/:id/status
Cambia el estado de un usuario (active, inactive, banned).

**Body:**
```json
{
  "status": "banned",
  "reason": "Comportamiento fraudulento detectado"
}
```

### GET /admin/refunds (Requiere Auth + Admin)
Lista todas las solicitudes de devolución pendientes.

**Query params:**
- `page`: Número de página
- `limit`: Items por página

**Response:**
```json
{
  "refunds": [
    {
      "id": "uuid",
      "status": "refund_requested",
      "refundStatus": "requested",
      "refundReason": "Producto defectuoso",
      "totalAmount": 59.99,
      "user": {
        "firstName": "Juan",
        "lastName": "García",
        "email": "juan@ejemplo.com"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

### POST /admin/refunds/:orderId/approve (Requiere Auth + Admin)
Aprueba y procesa una solicitud de devolución.

**Response:**
```json
{
  "message": "Devolución aprobada y procesada correctamente",
  "order": {
    "id": "uuid",
    "refundStatus": "approved",
    "refundAmount": 59.99,
    "refundedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST /admin/refunds/:orderId/reject (Requiere Auth + Admin)
Rechaza una solicitud de devolución.

**Body:**
```json
{
  "reason": "No cumple con la política de devoluciones"
}
```

**Response:**
```json
{
  "message": "Solicitud de devolución rechazada",
  "order": {
    "id": "uuid",
    "refundStatus": "rejected",
    "refundRejectionReason": "No cumple con la política de devoluciones"
  }
}
```

---

## 🏥 HEALTH CHECK

### GET /health
Verifica que el servidor está funcionando.

---

## Estados de Pedido
- `pending`: Pendiente de pago
- `paid`: Pagado
- `processing`: En preparación
- `shipped`: Enviado
- `delivered`: Entregado
- `cancelled`: Cancelado
- `refund_requested`: Solicitud de devolución enviada
- `refunded`: Pedido reembolsado

## Estados de Devolución (refundStatus)
- `none`: Sin solicitud de devolución
- `requested`: Solicitud enviada, pendiente de revisión
- `approved`: Devolución aprobada y procesada
- `rejected`: Devolución rechazada por el administrador

## Roles de Usuario
- `customer`: Cliente normal
- `admin`: Administrador

## Estados de Cuenta de Usuario
- `active`: Cuenta activa y funcional
- `inactive`: Cuenta desactivada por el usuario (soft delete)
- `banned`: Cuenta suspendida por el administrador
