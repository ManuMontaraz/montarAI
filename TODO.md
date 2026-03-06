# 🛒 TODO List - MontarAI Backend

## FASE 1: Configuración Inicial
- [x] Crear estructura de carpetas del proyecto
- [x] Inicializar package.json e instalar dependencias
- [x] Configurar variables de entorno (.env)
- [x] Configurar conexión a MySQL
- [x] Crear modelos de base de datos (Users, Addresses, Orders)

## FASE 2: Autenticación
- [x] Implementar registro de usuarios
- [x] Verificación de email al registrarse
- [x] Implementar login con JWT
- [x] Middleware de autenticación
- [x] Endpoint /me (perfil del usuario)
- [x] Recuperación de contraseña por email
- [x] Cambio de contraseña (usuario logueado, requiere contraseña actual)
- [x] Actualizar perfil (nombre, apellidos, teléfono opcional)
- [x] Cambiar email (requiere contraseña + verificación del nuevo email)
- [x] Desactivar cuenta propia (soft delete)
- [x] Admin: Activar/desactivar/banear cuentas de usuarios

## FASE 3: Gestión de Direcciones
- [x] CRUD de direcciones de envío
- [x] Validación de campos (calle, CP, ciudad, etc.)
- [x] Marcar dirección por defecto

## FASE 4: Integración Stripe
- [x] Configurar SDK de Stripe
- [x] Endpoint GET /products (listar desde Stripe)
- [x] Endpoint POST /checkout/payment-intent
- [x] Implementar Stripe Elements en frontend (backend listo, frontend pendiente)
- [x] Configurar webhook handler
- [x] Procesar evento payment_intent.succeeded
- [x] Paginación de productos (cursor-based con limit)
  - GET /products?limit=20&starting_after=prod_123

## FASE 5: Pedidos
- [x] Crear tabla orders en DB
- [x] Guardar pedido al recibir webhook
- [x] Endpoint GET /orders (historial usuario)
- [x] Enviar email confirmación de pedido

## FASE 6: Dashboard Admin
- [x] Middleware de autorización (admin)
- [x] Endpoint estadísticas del dashboard
- [x] Endpoint listado de pedidos (todos)
- [x] Endpoint actualizar estado de pedido
- [x] Endpoint añadir tracking number

## FASE 7: Sistema de Emails (SMTP)
- [x] Configurar Nodemailer con SMTP
- [x] Plantilla email de verificación
- [x] Plantilla email recuperación contraseña
- [x] Plantilla email confirmación pedido

## FASE 8: Testing y Documentación
- [x] Probar flujo completo de compra
- [x] Probar webhooks con ngrok
- [x] Crear archivo API.md con endpoints
- [x] Revisar seguridad (validaciones, headers)

## CONFIGURACIÓN EXTERNA (Stripe Dashboard)
- [x] Crear productos en Stripe
- [x] Configurar tasas de IVA
- [x] Configurar webhook endpoint (URL producción/ngrok)
- [x] Obtener claves API (test y live)

## FASE 10: Sistema de Devoluciones
- [x] Añadir campos de refund a modelo Order
- [x] Endpoint POST /orders/:id/request-refund (cliente)
- [x] Endpoint GET /admin/refunds (listar solicitudes)
- [x] Endpoint POST /admin/refunds/:orderId/approve (procesar reembolso Stripe)
- [x] Endpoint POST /admin/refunds/:orderId/reject (rechazar solicitud)
- [x] Email template simple: "Se ha iniciado el proceso de devolución"

## FASE 11: Documentación Completa en README
- [x] Añadir sección "API Endpoints" con todos los endpoints
- [x] Ejemplos de request/response para cada endpoint
- [x] Tabla de códigos de error
- [x] Guía de autenticación

## FASE 12: Internacionalización (i18n)
- [x] Crear sistema base de traducción (i18n.js + translator.js)
- [x] Crear archivos de traducción (es.json + en.json)
- [x] Middleware detector de idioma (query > header > default)
- [x] Actualizar controladores con sistema de traducción
- [x] Actualizar emails con templates multilenguaje
- [x] Actualizar validaciones con mensajes traducidos
- [x] Formato de respuesta: { key, message, lang }

## FASE 13: Configuración de Marca Dinámica
- [x] Crear src/config/app.js con todas las variables
- [x] Actualizar .env.example con variables de marca
- [x] Actualizar traducciones con placeholders dinámicos
- [x] Actualizar servicio de email con branding configurable
- [x] Implementar helper para redes sociales condicionales
- [x] Actualizar README.md con documentación completa

## DEPLOY (Documentación completa en README.md)
- [x] Guía de despliegue Debian + Apache
- [x] Configuración PM2 para producción
- [x] Reverse proxy con Apache
- [x] SSL con Let's Encrypt
- [x] Backup automático MySQL
- [x] Checklist de despliegue
