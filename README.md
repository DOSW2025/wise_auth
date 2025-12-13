# Wise Auth - Microservicio de Autenticación

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Descripción

Wise Auth es el microservicio de autenticación y autorización del ecosistema ECIWISE. Está construido con NestJS y maneja todo el ciclo de autenticación OAuth 2.0 con Google, generación de tokens JWT, y gestión de usuarios con un sistema de roles basado en RBAC.

Este servicio actúa como el punto central de autenticación para los demás microservicios del proyecto, proporcionando tokens JWT que se validan en cada request. Además, incluye un módulo completo de gestión de usuarios con estadísticas, filtros avanzados y un sistema de caché optimizado.

### Características principales

- **Autenticación OAuth 2.0 con Google**: Flujo completo de autenticación con redirección al gateway
- **Sistema JWT**: Tokens firmados con expiración configurable y validación automática
- **RBAC (Role-Based Access Control)**: Sistema de roles con guards globales y decoradores personalizados
- **Gestión de usuarios**: CRUD completo con filtros, paginación y estadísticas
- **Sistema de caché inteligente**: Redis con fallback a memoria, invalidación automática
- **Integración con Azure Service Bus**: Envío de notificaciones asíncronas
- **Validación robusta**: class-validator + Joi para variables de entorno
- **Documentación Swagger**: API completamente documentada e interactiva

---

## Stack Tecnológico

### Core
- **NestJS** v11.0.1 - Framework principal
- **TypeScript** v5.7.3
- **Node.js** >= 18.x

### Base de Datos
- **PostgreSQL** >= 14.x
- **Prisma ORM** v7.0.1 con adapter PostgreSQL
- **@prisma/adapter-pg** v7.0.1

### Autenticación
- **Passport.js** v0.7.0
- **passport-jwt** v4.0.1
- **passport-google-oauth20** v2.0.0
- **@nestjs/jwt** v11.0.1
- **@nestjs/passport** v11.0.5

### Infraestructura
- **Redis** (opcional) - Sistema de caché distribuido
- **Azure Service Bus** - Cola de mensajería para notificaciones
- **cache-manager-redis-yet** v5.1.5

### Validación y Transformación
- **class-validator** v0.14.2
- **class-transformer** v0.5.1
- **joi** v18.0.1

### Documentación y Testing
- **@nestjs/swagger** v11.2.2
- **Jest** v30.0.0
- **Supertest** v7.0.0

---

## Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x
- Cuenta de Google Cloud Platform (para OAuth)
- Azure Service Bus (para notificaciones)
- Redis (opcional, pero recomendado para producción)

### 1. Clonar e instalar

```bash
git clone https://github.com/DOSW2025/wise_auth.git
cd wise_auth
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Aplicación
PORT=3000

# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/wise_auth?schema=public"
DIRECT_URL="postgresql://usuario:password@localhost:5432/wise_auth?schema=public"

# JWT
JWT_SECRET="tu_secreto_super_seguro_cambiar_en_produccion"
JWT_EXPIRATION="7d"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Gateway
GATEWAY_URL="http://localhost:4000"

# Azure Service Bus
SERVICEBUS_CONNECTION_STRING="Endpoint=sb://..."

# Redis (opcional)
REDIS_HOST="localhost"
REDIS_PORT=6380
REDIS_PASSWORD="tu_password_redis"
```

**Importante**: En producción, usa variables de entorno seguras y nunca commitees el archivo `.env`.

### 3. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Habilita la API de Google+ (o Google Identity)
4. Crea credenciales OAuth 2.0:
   - Tipo: ID de cliente de OAuth 2.0
   - Tipo de aplicación: Aplicación web
   - Orígenes autorizados: `http://localhost:3000` (o tu dominio en producción)
   - URI de redirección: `http://localhost:3000/auth/google/callback`
5. Copia el Client ID y Client Secret al `.env`

### 4. Configurar base de datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE wise_auth;"

# El cliente de Prisma se genera automáticamente con npm install
# pero si necesitas regenerarlo:
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales (roles y estados)
npx prisma db seed

# (Opcional) Abrir Prisma Studio para ver los datos
npx prisma studio
```

### 5. Configurar Redis (opcional pero recomendado)

Si no configuras Redis, el sistema usará caché en memoria como fallback. Para producción, es altamente recomendado usar Redis.

```bash
# Con Docker
docker run -d -p 6380:6379 --name redis-wise-auth redis:7-alpine

# O instalar Redis localmente según tu sistema operativo
```

---

## Ejecución

### Desarrollo

```bash
npm run start:dev
```

El servidor inicia en `http://localhost:3000` con hot-reload activado. Los cambios en el código se reflejan automáticamente.

### Producción

```bash
# Compilar
npm run build

# Ejecutar
npm run start:prod
```

El script `start:prod` automáticamente:
1. Genera el cliente de Prisma
2. Ejecuta las migraciones pendientes
3. Inicia la aplicación

### Debug

```bash
npm run start:debug
```

Permite conectar un debugger en el puerto 9229. Útil para debugging con VS Code o Chrome DevTools.

---

## Arquitectura

### Estructura del proyecto

```
src/
├── auth/                          # Módulo de autenticación
│   ├── decorators/
│   │   ├── get-user.decorator.ts  # @GetUser() - Extrae usuario del request
│   │   ├── public.decorator.ts    # @Public() - Marca rutas públicas
│   │   └── roles.decorator.ts      # @Roles() - Define roles requeridos
│   ├── dto/
│   │   ├── auth-response.dto.ts    # Respuesta de autenticación
│   │   ├── google-user.dto.ts     # DTO para datos de Google
│   │   └── notificaciones.dto.ts  # DTO para notificaciones
│   ├── enums/
│   │   └── role.enum.ts           # Enums de roles y estados
│   ├── guards/
│   │   ├── google-auth.guard.ts    # Guard para OAuth Google
│   │   ├── jwt-auth.guard.ts       # Guard JWT (global)
│   │   └── roles.guard.ts         # Guard de roles (global)
│   ├── strategies/
│   │   ├── google.strategy.ts      # Estrategia Passport para Google
│   │   └── jwt.strategy.ts        # Estrategia Passport para JWT
│   ├── auth.controller.ts         # Endpoints de autenticación
│   ├── auth.service.ts            # Lógica de negocio de auth
│   └── auth.module.ts             # Módulo de autenticación
├── gestion-usuarios/              # Módulo de gestión de usuarios
│   ├── dto/                       # DTOs para filtros y actualizaciones
│   ├── gestion-usuarios.controller.ts
│   ├── gestion-usuarios.service.ts
│   └── gestion-usuarios.module.ts
├── config/
│   ├── envs.ts                    # Validación de variables de entorno
│   └── index.ts
├── prisma/
│   ├── prisma.service.ts          # Servicio Prisma con adapter
│   └── prisma.module.ts
├── app.module.ts                  # Módulo raíz
└── main.ts                        # Entry point
```

### Flujo de autenticación

1. **Usuario accede a `/auth/google`**
   - El `GoogleAuthGuard` intercepta la request
   - Redirige al usuario a la página de consentimiento de Google

2. **Usuario autoriza en Google**
   - Google redirige a `/auth/google/callback` con un código de autorización
   - El `GoogleStrategy` intercambia el código por un access token
   - Se obtiene el perfil del usuario (email, nombre, foto)

3. **Validación y creación/actualización de usuario**
   - `AuthService.validateGoogleUser()` busca el usuario por `google_id` o `email`
   - Si existe: actualiza `ultimo_login` y `avatar_url`
   - Si no existe: crea nuevo usuario con rol `estudiante` y estado `activo`
   - Si está suspendido/inactivo: lanza excepción

4. **Generación de JWT**
   - Se crea un token JWT con payload: `{ sub: userId, email, rol }`
   - El token se firma con `JWT_SECRET` y expira según `JWT_EXPIRATION`

5. **Redirección al gateway**
   - Se redirige a `{GATEWAY_URL}/wise/auth/callback?token={JWT}&user={USER_DATA}`
   - El gateway maneja el resto del flujo (almacenar token, redirigir al frontend)

### Sistema de guards

El proyecto usa guards globales aplicados en `main.ts`:

1. **JwtAuthGuard**: Valida el token JWT en todas las rutas excepto las marcadas con `@Public()`
2. **RolesGuard**: Verifica que el usuario tenga los roles requeridos (si se especifican con `@Roles()`)

El orden importa: primero se valida el JWT, luego los roles.

### Sistema de caché

El sistema de caché está diseñado para optimizar consultas frecuentes:

- **Estrategia**: Redis (si está configurado) o memoria (fallback)
- **TTL por tipo de dato**:
  - Estadísticas generales: 5 minutos
  - Estadísticas por rol: 5 minutos
  - Crecimiento de usuarios: 10 minutos
  - Listas paginadas: 2 minutos
- **Invalidación**: Automática al crear/actualizar/eliminar usuarios
- **Registro de claves**: Sistema de registro para invalidar múltiples claves relacionadas

---

## API Endpoints

### Autenticación

#### `GET /auth/google`
Inicia el flujo OAuth 2.0 con Google. Redirige automáticamente a la página de consentimiento de Google.

**Nota**: Este endpoint no se puede probar directamente desde Swagger. Debes acceder desde el navegador.

#### `GET /auth/google/callback`
Callback de Google que procesa la autenticación y redirige al gateway con el token JWT.

**Response**: Redirección 307 al gateway con query params:
- `token`: JWT token
- `user`: Datos del usuario en JSON

### Gestión de Usuarios

Todos los endpoints de gestión requieren autenticación JWT.

#### `GET /gestion-usuarios`
Lista usuarios con filtros y paginación. Solo administradores.

**Query params**:
- `page` (default: 1): Número de página
- `limit` (default: 10): Resultados por página
- `search` (opcional): Búsqueda por nombre, apellido o email
- `rolId` (opcional): Filtrar por rol (1=estudiante, 2=tutor, 3=admin)
- `estadoId` (opcional): Filtrar por estado (1=activo, 2=inactivo, 3=suspendido)

**Response**:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### `PATCH /gestion-usuarios/:id/rol`
Cambia el rol de un usuario. Solo administradores.

**Body**:
```json
{
  "rolId": 2
}
```

#### `PATCH /gestion-usuarios/:id/estado`
Cambia el estado de un usuario. Solo administradores.

**Body**:
```json
{
  "estadoId": 3
}
```

#### `PATCH /gestion-usuarios/me/info-personal`
Actualiza la información personal del usuario autenticado (teléfono, biografía).

**Body**:
```json
{
  "telefono": "+57 300 123 4567",
  "biografia": "Estudiante de ingeniería..."
}
```

#### `DELETE /gestion-usuarios/:id`
Elimina un usuario. Solo administradores.

#### `DELETE /gestion-usuarios/me/cuenta`
Elimina la cuenta del usuario autenticado.

### Estadísticas

Todos los endpoints de estadísticas requieren rol de administrador.

#### `GET /gestion-usuarios/estadisticas/usuarios`
Obtiene estadísticas generales de usuarios (totales, activos, suspendidos, inactivos).

**Response**:
```json
{
  "resumen": {
    "total": 100,
    "activos": {
      "conteo": 75,
      "porcentaje": 75.00
    },
    "suspendidos": {
      "conteo": 15,
      "porcentaje": 15.00
    },
    "inactivos": {
      "conteo": 10,
      "porcentaje": 10.00
    }
  }
}
```

#### `GET /gestion-usuarios/estadisticas/roles`
Obtiene estadísticas de usuarios por rol.

**Response**:
```json
{
  "totalUsuarios": 100,
  "roles": [
    {
      "rolId": 1,
      "rol": "estudiante",
      "conteo": 75,
      "porcentaje": 75.00
    },
    ...
  ]
}
```

#### `GET /gestion-usuarios/estadisticas/crecimiento?weeks=12`
Obtiene el crecimiento de usuarios por semana. Por defecto 12 semanas, máximo 52.

**Query params**:
- `weeks` (opcional, default: 12): Número de semanas a analizar

**Response**:
```json
{
  "periodo": {
    "inicio": "2024-09-15T00:00:00.000Z",
    "fin": "2024-12-07T00:00:00.000Z",
    "semanas": 12
  },
  "totalUsuariosNuevos": 150,
  "data": [
    {
      "semana": "2024-W38",
      "conteo": 10,
      "fecha": "15 sep"
    },
    ...
  ]
}
```

---

## Documentación Swagger

La API está completamente documentada con Swagger/OpenAPI. Una vez que el servidor esté corriendo, accede a:

```
http://localhost:3000/api/docs
```

### Características

- **Exploración interactiva**: Prueba todos los endpoints directamente desde el navegador
- **Autenticación JWT**: Usa el botón "Authorize" para agregar tu token JWT
- **Esquemas de datos**: Ve la estructura completa de requests y responses
- **Ejemplos**: Cada endpoint incluye ejemplos de uso

### Cómo usar JWT en Swagger

1. Obtén un token mediante el flujo de autenticación (`/auth/google`)
2. Haz click en el botón **"Authorize"** (🔓) en la parte superior
3. Ingresa: `Bearer <tu-token-jwt>`
4. Haz click en "Authorize"
5. Ahora puedes probar todos los endpoints protegidos

---

## Sistema de Roles y Estados

### Roles

Los roles se almacenan en la tabla `roles` y se relacionan con usuarios mediante `rolId`:

- **estudiante** (ID: 1) - Rol por defecto para nuevos usuarios
- **tutor** (ID: 2) - Usuarios con permisos de tutoría
- **admin** (ID: 3) - Administradores con permisos completos

### Estados

Los estados se almacenan en la tabla `estados_usuario`:

- **activo** (ID: 1) - Estado por defecto
- **inactivo** (ID: 2) - Usuario inactivo
- **suspendido** (ID: 3) - Usuario suspendido (no puede iniciar sesión)

### Uso de decoradores

```typescript
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from './auth/enums/role.enum';
import { Public } from './auth/decorators/public.decorator';
import { GetUser } from './auth/decorators/get-user.decorator';

// Solo admin puede acceder
@Roles(Role.ADMIN)
@Get('admin-only')
adminRoute() {
  return 'Solo admin';
}

// Admin o tutor pueden acceder
@Roles(Role.ADMIN, Role.TUTOR)
@Get('staff-only')
staffRoute() {
  return 'Admin o tutor';
}

// Ruta pública (sin JWT)
@Public()
@Get('public')
publicRoute() {
  return 'Acceso público';
}

// Extraer usuario del request
@Get('profile')
getProfile(@GetUser() user) {
  return user;
}

// Extraer solo el ID del usuario
@Get('my-id')
getMyId(@GetUser('id') userId: string) {
  return { userId };
}
```

---

## Base de Datos

### Modelo de Usuario

El modelo principal es `Usuario` con las siguientes características:

- **Identificación**: `id` (UUID), `email` (único), `google_id` (único, opcional)
- **Datos personales**: `nombre`, `apellido`, `telefono`, `biografia`, `semestre`
- **Autenticación**: `google_id`, `avatar_url`, `ultimo_login`
- **Relaciones**: `rolId` → `Rol`, `estadoId` → `EstadoUsuario`
- **Timestamps**: `createdAt`, `updatedAt`

### Relaciones importantes

El schema incluye relaciones con otros módulos del ecosistema:

- **Notificaciones**: Un usuario tiene muchas notificaciones
- **Tutorías**: Relaciones con sesiones como tutor o estudiante
- **Materiales**: Usuarios pueden subir materiales educativos
- **Ratings**: Usuarios pueden calificar sesiones de tutoría

### Comandos Prisma útiles

```bash
# Crear una nueva migración
npx prisma migrate dev --name descripcion_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (solo desarrollo - elimina todos los datos)
npx prisma migrate reset

# Abrir Prisma Studio (interfaz visual para ver/editar datos)
npx prisma studio

# Generar cliente después de cambios en schema
npx prisma generate

# Ver el estado de las migraciones
npx prisma migrate status
```

---

## Testing

### Tests unitarios

```bash
# Ejecutar todos los tests
npm run test

# Modo watch (se ejecutan automáticamente al cambiar archivos)
npm run test:watch

# Con cobertura
npm run test:cov

# Modo debug
npm run test:debug
```

### Tests end-to-end

```bash
npm run test:e2e
```

Los tests e2e prueban el flujo completo de la aplicación, incluyendo autenticación y gestión de usuarios.

### Estructura de tests

Los tests unitarios están junto al código que prueban (archivos `.spec.ts`), mientras que los tests e2e están en la carpeta `test/`.

---

## Variables de Entorno

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `PORT` | Puerto del servidor | `3000` | ✅ |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/db` | ✅ |
| `DIRECT_URL` | URL directa para migraciones | `postgresql://user:pass@localhost:5432/db` | ✅ |
| `JWT_SECRET` | Secreto para firmar JWT | `supersecret123` | ✅ |
| `JWT_EXPIRATION` | Tiempo de expiración del JWT | `7d` o `3600` | ✅ |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `123-abc.apps.googleusercontent.com` | ✅ |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | `GOCSPX-abc123` | ✅ |
| `GOOGLE_CALLBACK_URL` | URL de callback de Google | `http://localhost:3000/auth/google/callback` | ✅ |
| `GATEWAY_URL` | URL del API Gateway | `http://localhost:4000` | ✅ |
| `SERVICEBUS_CONNECTION_STRING` | Connection string de Azure Service Bus | `Endpoint=sb://...` | ✅ |
| `REDIS_HOST` | Host de Redis | `localhost` | ⚪ |
| `REDIS_PORT` | Puerto de Redis | `6380` | ⚪ |
| `REDIS_PASSWORD` | Password de Redis | `password` | ⚪ |

**Leyenda**: ✅ Requerido | ⚪ Opcional

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila el proyecto TypeScript a JavaScript |
| `npm run start` | Inicia la aplicación (genera Prisma, migra DB, ejecuta) |
| `npm run start:dev` | Inicia con hot-reload para desarrollo |
| `npm run start:debug` | Inicia en modo debug (puerto 9229) |
| `npm run start:prod` | Inicia en modo producción (genera Prisma, migra DB, ejecuta) |
| `npm run lint` | Ejecuta ESLint para verificar código |
| `npm run format` | Formatea código con Prettier |
| `npm run test` | Ejecuta tests unitarios |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run test:cov` | Genera reporte de cobertura |
| `npm run test:debug` | Ejecuta tests en modo debug |
| `npm run test:e2e` | Ejecuta tests end-to-end |

---

## Consideraciones de Producción

### Seguridad

- **JWT_SECRET**: Usa un secreto fuerte y único. Genera uno con: `openssl rand -base64 32`
- **HTTPS**: Siempre usa HTTPS en producción
- **CORS**: Configura los orígenes permitidos correctamente
- **Rate Limiting**: Considera implementar rate limiting para prevenir abusos
- **Variables de entorno**: Nunca commitees archivos `.env`

### Performance

- **Redis**: Usa Redis en producción para el sistema de caché
- **Connection Pooling**: Prisma maneja el pooling automáticamente, pero revisa la configuración
- **Índices**: El schema de Prisma incluye índices en campos frecuentemente consultados

### Monitoreo

- **Logging**: El proyecto usa el Logger de NestJS. Considera integrar con un servicio de logging centralizado
- **Health Checks**: Considera agregar endpoints de health check para monitoreo
- **Métricas**: Considera agregar métricas de performance (tiempo de respuesta, errores, etc.)

---

## Convenciones de Commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
<tipo>(<alcance>): <descripción>
```

### Tipos

- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Cambios en documentación
- `style` - Cambios de formato (no afectan funcionalidad)
- `refactor` - Refactorización de código
- `test` - Añadir o modificar tests
- `chore` - Tareas de mantenimiento

### Ejemplos

```bash
feat(auth): agregar validación de usuarios suspendidos
fix(jwt): corregir expiración de tokens
docs(readme): actualizar instrucciones de instalación
refactor(cache): optimizar invalidación de caché
test(auth): agregar tests para Google OAuth
chore(deps): actualizar dependencias
```

---

## Troubleshooting

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Database connection failed"

Verifica que:
- PostgreSQL esté corriendo
- Las credenciales en `DATABASE_URL` sean correctas
- La base de datos exista

### Error: "Google OAuth failed"

Verifica que:
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- `GOOGLE_CALLBACK_URL` coincida con la configurada en Google Cloud Console
- Los orígenes autorizados incluyan tu dominio

### Error: "Redis connection failed"

Si Redis no está disponible, el sistema usará caché en memoria automáticamente. Para producción, asegúrate de que Redis esté configurado correctamente.

### Error: "ServiceBus sender not initialized"

Verifica que `SERVICEBUS_CONNECTION_STRING` sea correcto y que el servicio tenga permisos para enviar mensajes a la cola `mail.envio.individual`.

---

## Enlaces Útiles

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)

---

