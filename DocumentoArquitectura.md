# DOCUMENTO DE ARQUITECTURA POR EQUIPOS
## MÓDULO: WISE_AUTH - AUTENTICACIÓN Y GESTIÓN DE USUARIOS

**Fecha de Elaboración**: Diciembre 2025  
**Versión del Documento**: 2.0  
**Elaborado por**: Equipo Venus 
---

## 1. DESCRIPCIÓN DEL MÓDULO

### 1.1 Visión General

El módulo **Wise Auth** es un microservicio especializado de autenticación y autorización que constituye la puerta de entrada y el guardián de seguridad de toda la plataforma ECIWISE. Este componente actúa como el sistema nervioso central de control de acceso, gestionando la identidad de los usuarios y sus permisos dentro del ecosistema educativo.

### 1.2 Propósito y Alcance

Este microservicio ha sido diseñado con un propósito triple:

1. **Autenticación Delegada**: Implementa OAuth 2.0 con Google como proveedor de identidad, eliminando la necesidad de gestionar credenciales locales y aprovechando la infraestructura de seguridad de Google. Esto permite que estudiantes, tutores y administradores accedan utilizando sus cuentas institucionales de manera segura y transparente.

2. **Autorización Basada en Roles (RBAC)**: Establece un sistema jerárquico de permisos que controla qué recursos y operaciones puede realizar cada usuario según su rol dentro de la plataforma (estudiante, tutor, administrador). Este modelo garantiza que cada usuario solo acceda a las funcionalidades pertinentes a su rol.

3. **Gestión Centralizada de Usuarios**: Mantiene un registro unificado de todos los usuarios del sistema, incluyendo su información de perfil, estado de cuenta, y metadatos de sesión. Sirve como fuente única de verdad (Single Source of Truth) para la identidad de usuarios en toda la arquitectura de microservicios.

### 1.3 Funcionalidades Principales

El módulo implementa las siguientes capacidades core:

**Autenticación OAuth 2.0 con Google:**
- Flujo completo de autorización con redirección a Google
- Validación de tokens de acceso de Google
- Extracción segura de información de perfil del usuario
- Creación automática de cuentas en el primer inicio de sesión
- Actualización de información de perfil en inicios de sesión subsecuentes

**Gestión de Tokens JWT:**
- Generación de tokens JWT firmados con información del usuario
- Inclusión de claims personalizados (rol, estado, identificador único)
- Configuración de tiempo de expiración parametrizable
- Validación automática de tokens en cada petición protegida
- Renovación implícita de sesión mediante nuevo login

**Sistema de Control de Acceso Basado en Roles:**
- Definición de tres roles principales: estudiante, tutor y administrador
- Asignación automática de rol "estudiante" a nuevos usuarios
- Protección de endpoints mediante decoradores de rol
- Validación en tiempo de ejecución de permisos de usuario
- Soporte para requerimientos de múltiples roles (OR lógico)

**Gestión de Estado de Usuario:**
- Tres estados posibles: activo, inactivo, suspendido
- Estado "activo" por defecto en nuevos registros
- Posibilidad de suspender o desactivar cuentas problemáticas
- Validación de estado antes de permitir operaciones sensibles

**Integración con Sistema de Notificaciones:**
- Emisión de eventos a Azure Service Bus cuando se crea un nuevo usuario
- Permite que otros microservicios reaccionen a cambios en usuarios
- Envío automático de correos de bienvenida a nuevos usuarios

### 1.4 Usuarios y Casos de Uso

**Estudiante (Usuario Final - Consumidor de Servicios):**
- Inicia sesión con su cuenta de Google institucional
- Accede a funcionalidades básicas de la plataforma (solicitar tutorías, consultar materiales)
- Visualiza y actualiza su perfil personal
- No requiere aprobación manual para acceder al sistema

**Tutor (Usuario Final - Proveedor de Servicios):**
- Inicia sesión con cuenta Google institucional
- Puede ser promovido desde "estudiante" por un administrador
- Accede a funcionalidades extendidas (publicar disponibilidad, gestionar sesiones de tutoría)
- Visualiza estadísticas de sus tutorías y calificaciones recibidas

**Administrador (Usuario Privilegiado - Gestor del Sistema):**
- Cuenta con acceso completo a funcionalidades administrativas
- Puede modificar roles de otros usuarios
- Puede suspender o reactivar cuentas
- Supervisa logs de autenticación y accesos al sistema
- Gestiona configuración de seguridad de la plataforma

**Microservicios Hermanos (Sistemas Consumidores):**
- Validan tokens JWT recibidos en peticiones de usuarios
- Extraen información de identidad (userId, email, rol) del token
- Toman decisiones de autorización basadas en el rol del usuario
- No acceden directamente a la base de datos de usuarios

### 1.5 Beneficios de la Arquitectura de Microservicio

La decisión de implementar la autenticación como un microservicio independiente ofrece múltiples ventajas:

**Separación de Responsabilidades**: Al aislar la lógica de autenticación, cada microservicio puede enfocarse en su dominio específico sin preocuparse por la gestión de identidades. Esto reduce la complejidad cognitiva de cada servicio.

**Seguridad Centralizada**: Las políticas de seguridad, la gestión de secretos, y las validaciones se implementan una sola vez en lugar de replicarse en cada microservicio. Cualquier mejora o parche de seguridad se aplica inmediatamente a toda la plataforma.

**Escalabilidad Independiente**: El módulo de autenticación puede escalarse horizontalmente sin afectar otros servicios. Si aumenta el tráfico de logins (por ejemplo, al inicio de un semestre), se pueden agregar más instancias de este servicio específicamente.

**Reusabilidad**: Otros proyectos o módulos futuros del ecosistema ECIWISE pueden consumir este mismo servicio de autenticación sin necesidad de reimplementar la lógica.

**Mantenibilidad**: Los cambios en el flujo de autenticación (por ejemplo, agregar autenticación con Microsoft o Facebook) se realizan en un solo lugar. El equipo responsable puede iterar rápidamente sin coordinación compleja con otros equipos.

**Resiliencia**: Si el servicio de autenticación falla, los usuarios ya autenticados (con tokens válidos) pueden seguir operando en otros microservicios. Además, se pueden implementar estrategias de fallback o caché de validaciones.

---

## 2. ANÁLISIS DE TECNOLOGÍAS Y DECISIONES DE DISEÑO ARQUITECTÓNICO GENERAL

### 2.1 Lenguaje de Programación: TypeScript

**Decisión**: TypeScript v5.7.3

**Justificación Detallada**:

TypeScript fue seleccionado como lenguaje principal por encima de JavaScript vanilla por razones fundamentales de calidad de código y productividad de desarrollo:

**Tipado Estático y Seguridad en Tiempo de Compilación**: TypeScript introduce un sistema de tipos robusto que detecta errores comunes antes de que el código se ejecute. En un sistema de autenticación, donde un error podría comprometer la seguridad de toda la plataforma, esta validación anticipada es invaluable. Por ejemplo, el compilador verifica que los DTOs de usuario contengan todos los campos obligatorios (email, nombre, apellido) antes de que el código llegue a producción.

**Autocompletado y Experiencia de Desarrollo**: Los IDEs modernos (VSCode, WebStorm) ofrecen autocompletado inteligente basado en los tipos de TypeScript. Cuando un desarrollador trabaja con el servicio de autenticación, el IDE sugiere automáticamente los métodos disponibles del PrismaService, sus parámetros requeridos, y el tipo de retorno esperado. Esto reduce drásticamente el tiempo de onboarding de nuevos desarrolladores y minimiza errores por nombres de método incorrectos.

**Refactoring Seguro**: En un proyecto que evoluciona constantemente, como ECIWISE, la capacidad de refactorizar código con confianza es crucial. Si decidimos cambiar la estructura del objeto "Usuario" (por ejemplo, separar "nombre completo" en "nombre" y "apellido"), TypeScript nos mostrará automáticamente todos los lugares del código que se ven afectados. En JavaScript vanilla, estos cambios requerirían búsquedas manuales propensas a errores.

**Documentación Implícita**: Los tipos actúan como documentación viva del código. Un desarrollador que revisa la definición del método `validateGoogleUser(googleUserDto: GoogleUserDto)` sabe inmediatamente qué campos debe incluir el DTO sin necesidad de leer documentación externa o el código de implementación.

**Integración Natural con NestJS**: NestJS está construido con TypeScript como ciudadano de primera clase. Los decoradores (@Injectable, @Get, @Post), el sistema de inyección de dependencias, y los guards de autenticación aprovechan las capacidades avanzadas de TypeScript. Usar JavaScript sería remar contra la corriente del framework.

**Ecosistema y Librerías**: Las librerías críticas del proyecto (Prisma, Passport, class-validator) están escritas en TypeScript o tienen definiciones de tipos de primera calidad. Esto garantiza una experiencia de desarrollo coherente en toda la stack.

### 2.2 Framework Backend: NestJS

**Decisión**: NestJS v11.0.1

**Justificación Detallada**:

NestJS fue elegido como framework de backend por encima de alternativas como Express.js puro, Fastify, o Koa debido a sus características empresariales y su filosofía de arquitectura:

**Arquitectura Modular y Escalable**: NestJS impone una estructura modular inspirada en Angular, donde cada funcionalidad se encapsula en módulos (@Module) con sus propios controladores, servicios, y dependencias. En nuestro caso, el módulo de autenticación (AuthModule) es completamente independiente del módulo de Prisma (PrismaModule), facilitando el mantenimiento y la comprensión del código. Esta modularidad es especialmente valiosa cuando el proyecto crece y múltiples desarrolladores trabajan en paralelo.

**Inyección de Dependencias Nativa**: El sistema de DI de NestJS es extremadamente robusto y permite desacoplar componentes de manera elegante. Por ejemplo, el AuthService recibe PrismaService inyectado automáticamente en su constructor, sin necesidad de instanciarlo manualmente o usar singletons globales. Esto facilita enormemente el testing (podemos inyectar mocks) y permite cambiar implementaciones sin tocar código dependiente.

**Decoradores para Reducir Boilerplate**: Los decoradores de NestJS (@Get, @Post, @Body, @Param) eliminan la necesidad de escribir código repetitivo de parsing y validación. Un endpoint como `@Post('login')` automáticamente registra la ruta, aplica el método HTTP correcto, y extrae el body de la petición. Sin NestJS, cada endpoint requeriría configuración manual de routing, middleware de parsing, y manejo de errores.

**Guards y Middleware Integrados**: La protección de rutas mediante guards (@UseGuards(JwtAuthGuard, RolesGuard)) es declarativa y fácil de entender. El código de autenticación está separado de la lógica de negocio, respetando el principio de Separación de Responsabilidades (SoC). En Express.js puro, tendríamos que escribir middleware personalizado y aplicarlo manualmente en cada ruta protegida.

**Soporte Nativo para Microservicios**: Aunque actualmente wise_auth funciona como API REST, NestJS facilita la migración futura a patrones de microservicios como colas de mensajes (RabbitMQ, Kafka) o gRPC sin reescribir la lógica de negocio. El código de servicio permanece prácticamente igual, solo cambia la capa de transporte.

**Documentación Automática con Swagger**: La integración con Swagger/OpenAPI mediante @nestjs/swagger es trivial. Con simples decoradores (@ApiTags, @ApiOperation, @ApiResponse), el módulo genera documentación interactiva accesible en /api/docs. Esto es invaluable para que otros equipos consuman nuestro API.

**Ecosistema Maduro**: NestJS cuenta con módulos oficiales para prácticamente todas las necesidades comunes: @nestjs/jwt para JWT, @nestjs/passport para autenticación, @nestjs/config para variables de entorno. Esto evita tener que integrar librerías de terceros manualmente y garantiza compatibilidad entre versiones.

**TypeScript First**: A diferencia de Express.js (diseñado para JavaScript), NestJS fue construido desde cero con TypeScript. Los tipos, interfaces, y decoradores están completamente integrados y no se sienten como "añadidos" posteriores.

**Comparación con Alternativas**:
- **Express.js puro**: Requiere configuración manual extensa, no impone estructura, propenso a código espagueti en proyectos grandes.
- **Fastify**: Más rápido que Express pero carece de la estructura opinada de NestJS. Bueno para APIs simples, no para aplicaciones complejas.
- **Koa**: Minimalista y moderno pero requiere muchas decisiones arquitectónicas manuales. No hay estándar de estructura de proyecto.

### 2.3 Base de Datos: PostgreSQL

**Decisión**: PostgreSQL v14+

**Justificación Detallada**:

PostgreSQL fue seleccionado como sistema de gestión de base de datos por sus capacidades avanzadas y su madurez en entornos de producción:

**Modelo Relacional y Integridad Referencial**: El dominio de usuarios y roles es inherentemente relacional. Un usuario pertenece a un rol, y un rol puede tener muchos usuarios (relación uno-a-muchos). PostgreSQL permite definir estas relaciones con Foreign Keys, garantizando integridad referencial. Si intentamos eliminar un rol que tiene usuarios asociados, la base de datos rechaza la operación, previniendo estados inconsistentes. En bases NoSQL como MongoDB, esta integridad debe implementarse manualmente en la capa de aplicación.

**ACID y Transacciones**: Las operaciones de autenticación requieren atomicidad. Por ejemplo, cuando un usuario se logins por primera vez, se crean registros en múltiples tablas (usuario, perfil_tutor si aplica). PostgreSQL garantiza que estas operaciones son atómicas: o se completan todas o no se completa ninguna. Esto previene usuarios "a medias" en la base de datos.

**Índices Avanzados**: PostgreSQL soporta índices B-tree, Hash, GiST, y GIN. En nuestra tabla de usuarios, tenemos un índice único en el campo `email` que acelera dramáticamente las búsquedas durante el login. Sin este índice, buscar un usuario entre millones requeriría un table scan completo (O(n)). Con el índice, la búsqueda es O(log n).

**Tipos de Datos Ricos**: Utilizamos el tipo JSON para almacenar la disponibilidad de los tutores (horarios de tutoría por día de la semana). PostgreSQL permite consultas dentro de estos JSONs con operadores especializados (->>, @>, etc.), algo que bases de datos más simples como MySQL no soportan tan robustamente.

**Full Text Search Integrado**: Aunque no lo usamos actualmente, PostgreSQL incluye capacidades de búsqueda de texto completo sin necesidad de servicios externos como Elasticsearch. Esto podría ser útil en el futuro para buscar usuarios por biografía o intereses.

**Extensibilidad**: PostgreSQL permite crear funciones personalizadas en SQL, PL/pgSQL, o incluso Python. Si necesitáramos lógica compleja de validación de emails institucionales (por ejemplo, verificar que pertenecen a la universidad), podríamos implementarlo como una función de base de datos.

**Concurrencia Multiversion (MVCC)**: PostgreSQL maneja múltiples transacciones concurrentes sin bloqueos excesivos gracias a MVCC. Si 100 estudiantes intentan hacer login simultáneamente, PostgreSQL gestiona estas peticiones eficientemente sin que una transacción bloquee a las demás.

**Hosting Gestionado**: Servicios como Supabase, AWS RDS, Google Cloud SQL, y Azure Database ofrecen PostgreSQL gestionado con backups automáticos, réplicas de lectura, y escalabilidad vertical. Esto reduce la carga operativa del equipo de desarrollo.

**Comparación con Alternativas**:
- **MySQL**: Aunque popular, tiene limitaciones en tipos de datos (JSON menos robusto), y su ecosistema es menos moderno. PostgreSQL es considerado más "correcto" en su implementación SQL.
- **MongoDB**: Excelente para documentos sin esquema, pero nuestro dominio de usuarios tiene esquema fijo y relaciones. MongoDB requeriría embeber roles en cada usuario o hacer joins manuales (lookups).
- **SQLite**: Adecuado para desarrollo local pero no para producción con múltiples instancias concurrentes. No soporta conexiones simultáneas de escritura robustamente.

### 2.4 ORM: Prisma

**Decisión**: Prisma v6.19.0

**Justificación Detallada**:

Prisma fue elegido como capa de abstracción de base de datos por encima de alternativas como TypeORM, Sequelize, o SQL crudo:

**Schema Declarativo y Type-Safe**: Prisma utiliza un lenguaje declarativo (schema.prisma) para definir modelos. A partir de este schema, genera automáticamente un cliente TypeScript completamente tipado. Esto significa que el compilador de TypeScript nos avisa si intentamos acceder a un campo que no existe o si pasamos un tipo incorrecto. Por ejemplo, `prisma.usuario.create({ data: { email: 123 }})` falla en compilación porque email debe ser string.

**Migraciones Automáticas**: Cuando modificamos el schema (por ejemplo, agregamos un campo "biografia" al modelo Usuario), Prisma genera automáticamente la migración SQL necesaria con `prisma migrate dev`. No tenemos que escribir SQL manual propenso a errores. Además, las migraciones son versionadas y se pueden revisar antes de aplicarlas.

**Query Seguro y Autocompletado**: Las consultas a la base de datos se escriben en TypeScript con autocompletado completo. Por ejemplo:

```typescript
const user = await prisma.usuario.findUnique({
  where: { email: 'user@example.com' },
  include: { rol: true, estado: true }
});
```

El IDE sugiere los campos de `where`, los posibles valores de `include`, y el tipo de retorno es inferido automáticamente. En TypeORM o Sequelize, el autocompletado es limitado y los tipos son más genéricos.

**Relaciones Intuitivas**: Definir relaciones uno-a-muchos o muchos-a-muchos en Prisma es extremadamente simple. La relación Usuario -> Rol se define con:

```prisma
model Usuario {
  rolId Int
  rol   Rol @relation(fields: [rolId], references: [id])
}
```

Prisma automáticamente genera métodos para navegar esta relación (`user.rol`, `rol.usuarios`). En SQL crudo, cada join requiere escribir la consulta manualmente.

**Prevención de SQL Injection**: Todas las queries de Prisma utilizan parámetros preparados internamente, previniendo ataques de inyección SQL sin esfuerzo del desarrollador. Incluso si un usuario malicioso pasa `email = "'; DROP TABLE usuarios; --"`, Prisma lo trata como string literal, no como SQL.

**Introspección de Base de Datos**: Si heredamos una base de datos existente, Prisma puede generar automáticamente el schema a partir de las tablas con `prisma db pull`. Esto facilitó la integración con bases de datos compartidas entre microservicios.

**Prisma Studio**: Herramienta GUI incluida que permite visualizar y editar datos en desarrollo con `prisma studio`. Muy útil para debugging y pruebas manuales sin necesidad de pgAdmin o herramientas externas.

**Performance**: Prisma optimiza automáticamente las queries. Por ejemplo, si hacemos 10 findUnique consecutivos con el mismo where, Prisma puede batching estos requests en una sola query con WHERE IN. Además, genera índices basados en los @unique y @index del schema.

**Comparación con Alternativas**:
- **TypeORM**: Usa decoradores de clase que resultan verbosos. Tiene problemas de performance en queries complejas. Menos type-safety que Prisma.
- **Sequelize**: Diseñado para JavaScript, no TypeScript. Los tipos son agregados a posteriori y no son tan robustos. API más imperativa y menos declarativa.
- **SQL Crudo**: Máximo control pero máximo esfuerzo. Propenso a errores, sin autocompletado, sin type-safety. Ideal solo para queries ultra-optimizadas específicas.

---

## 3. ANÁLISIS DE TECNOLOGÍAS POR CATEGORÍA

### 3.1 Autenticación y Seguridad

#### 3.1.1 Passport.js v0.7.0

**Propósito**: Middleware de autenticación para Node.js con soporte para múltiples estrategias.

**Justificación de Elección**:

Passport es el estándar de facto para autenticación en Node.js con más de 500 estrategias disponibles (Google, Facebook, Twitter, SAML, etc.). Su arquitectura de "estrategias" permite cambiar o agregar métodos de autenticación sin reescribir la lógica core.

**Por qué es la mejor opción**:

**Abstracción de Complejidad**: OAuth 2.0 es un protocolo complejo con múltiples flujos (authorization code, implicit, client credentials). Passport encapsula esta complejidad detrás de una interfaz simple. El desarrollador solo necesita configurar la estrategia con client ID/secret y Passport maneja las redirecciones, validación de códigos, y extracción de tokens automáticamente.

**Estrategias Pluggables**: Si en el futuro queremos agregar login con Microsoft o Facebook, simplemente instalamos la estrategia correspondiente (passport-microsoft, passport-facebook) y la configuramos. El código de los guards y controladores permanece prácticamente igual.

**Integración NestJS**: @nestjs/passport proporciona una capa de integración perfecta. Las estrategias de Passport se convierten en providers de NestJS inyectables, y los guards se aplican con decoradores (@UseGuards). Sin esta integración, tendríamos que escribir mucho código de plomería manualmente.

**Sesiones vs JWT**: Passport soporta tanto sesiones tradicionales como JWT. Optamos por JWT (stateless) para facilitar el escalamiento horizontal, pero Passport nos da la flexibilidad de cambiar en el futuro si necesitamos sesiones persistentes.

**Comunidad y Mantenimiento**: Con más de 14k estrellas en GitHub y mantenimiento activo, Passport es una dependencia segura a largo plazo. Las estrategias son actualizadas cuando los proveedores (como Google) cambian sus APIs.

#### 3.1.2 Passport-Google-OAuth20 v2.0.0

**Propósito**: Estrategia de Passport para autenticación con Google OAuth 2.0.

**Justificación de Elección**:

Esta estrategia implementa específicamente el flujo OAuth 2.0 de Google, manejando las particularidades de sus endpoints y respuestas.

**Ventajas Específicas**:

**Configuración Declarativa**: La estrategia se configura con un simple objeto que especifica clientID, clientSecret, y callbackURL. No necesitamos entender los detalles de los endpoints de Google (/o/oauth2/auth, /o/oauth2/token) ni los parámetros de cada petición.

**Extracción Automática de Perfil**: Google retorna el perfil del usuario en un formato específico. La estrategia normaliza automáticamente estos datos en un objeto estándar con campos `id`, `emails`, `displayName`, `name`, etc. Esto evita parsing manual de JSON.

**Manejo de Scopes**: Configuramos qué permisos solicitamos al usuario (profile, email) y la estrategia los incluye automáticamente en la URL de autorización. Si necesitamos acceso a Google Calendar en el futuro, solo agregamos el scope correspondiente.

**Refresh Tokens**: Aunque no lo usamos actualmente, la estrategia soporta obtener refresh tokens de Google para mantener sesiones a largo plazo. Esto sería útil si necesitamos acceder a servicios de Google en nombre del usuario (enviar emails, acceder a Drive, etc.).

**Validación de Estado**: Implementa protección contra ataques CSRF usando el parámetro `state`. Google retorna este parámetro en el callback, y Passport verifica que coincide con el enviado originalmente.

#### 3.1.3 @nestjs/jwt v11.0.1

**Propósito**: Módulo de NestJS para generación y validación de JSON Web Tokens.

**Justificación de Elección**:

Este módulo proporciona una abstracción de alto nivel sobre la librería `jsonwebtoken`, integrándose perfectamente con el sistema de inyección de dependencias de NestJS.

**Razones de Adopción**:

**Configuración Global**: El módulo se registra globalmente en el AppModule con configuración compartida (secreto, tiempo de expiración). Cualquier servicio puede inyectar JwtService sin repetir configuración.

**Tipado Fuerte**: El método `sign(payload)` acepta cualquier objeto y lo serializa en el token. El método `verify(token)` retorna el payload deserializado con tipos inferidos. Esto previene errores de acceso a campos inexistentes.

**Seguridad por Defecto**: El módulo valida automáticamente la firma del token, la fecha de expiración, y los claims estándar (iss, sub, aud). Un token modificado o expirado es rechazado sin código adicional.

**Payload Personalizado**: Incluimos claims personalizados en el payload (userId, email, rol) sin romper la estructura estándar de JWT. Estos claims son accesibles en toda la aplicación a través del objeto `user` inyectado en las requests.

**Integración con Guards**: El JwtAuthGuard automáticamente extrae el token del header Authorization, lo valida, y si es válido, adjunta el payload a `request.user`. Esto permite que los controladores accedan al usuario autenticado sin parsing manual.

#### 3.1.4 Passport-JWT v4.0.1

**Propósito**: Estrategia de Passport para validar tokens JWT en requests entrantes.

**Justificación de Elección**:

Mientras @nestjs/jwt se usa para *generar* tokens, passport-jwt se usa para *validarlos* en cada request protegido.

**Beneficios Clave**:

**Extracción Flexible de Tokens**: Soporta múltiples métodos de extracción: Authorization header (Bearer token), query params (?token=xxx), cookies, o body. Usamos `ExtractJwt.fromAuthHeaderAsBearerToken()` que es el estándar OAuth 2.0.

**Validación Automática**: La estrategia valida el token contra el secreto configurado. Si el token es inválido, expirado, o modificado, la request es rechazada automáticamente con 401 Unauthorized.

**Payload en Request**: Si el token es válido, la estrategia extrae el payload y lo pasa al método `validate()` de nuestra JwtStrategy. Ahí podemos realizar validaciones adicionales (verificar que el usuario aún existe, que su estado es "activo") antes de permitir el acceso.

**Stateless**: No requiere almacenamiento de sesiones en el servidor. Cada request es autónoma, facilitando el escalamiento horizontal. Podemos tener 10 instancias del microservicio detrás de un load balancer sin preocuparnos por sincronización de sesiones.

**Performance**: La validación de JWT es extremadamente rápida (verificación criptográfica + deserialización JSON). No hay consultas a base de datos en cada request protegido (solo cuando generamos el token inicial).

#### 3.1.5 bcrypt v6.0.0

**Propósito**: Librería de hashing criptográfico para passwords.

**Justificación de Elección**:

Aunque actualmente no almacenamos passwords (usamos OAuth), bcrypt está incluido por si en el futuro agregamos autenticación con credenciales locales.

**Por qué bcrypt y no otras alternativas**:

**Slow by Design**: bcrypt está diseñado para ser *lento* (configurable con "rounds"). Esto dificulta ataques de fuerza bruta. Un atacante con una tarjeta gráfica potente puede probar miles de millones de hashes SHA256 por segundo, pero solo miles de hashes bcrypt.

**Salt Automático**: bcrypt genera un salt aleatorio único para cada password y lo incluye en el hash. Esto previene ataques de rainbow tables (tablas precalculadas de hashes comunes).

**Adaptive Cost**: El parámetro "rounds" (10 por defecto) define cuántas veces se aplica el algoritmo. Conforme los computadores se vuelven más rápidos, podemos incrementar los rounds para mantener la seguridad.

**Estándar de la Industria**: bcrypt es usado por plataformas como GitHub, Twitter, y prácticamente todas las aplicaciones serias. Está ampliamente auditado y es considerado seguro.

**Comparación con Alternativas**:
- **SHA256/MD5**: Diseñados para ser rápidos, no seguros para passwords. Susceptibles a brute force.
- **Argon2**: Más moderno que bcrypt y ganador de la competencia Password Hashing Competition. Sin embargo, bcrypt tiene mayor adopción y más librerías maduras en Node.js.
- **scrypt**: Similar a bcrypt pero con opciones de configuración más complejas. bcrypt es más simple de usar correctamente.

### 3.2 Validación de Datos

#### 3.2.1 class-validator v0.14.2

**Propósito**: Librería de validación de datos basada en decoradores de TypeScript.

**Justificación de Elección**:

class-validator permite definir reglas de validación directamente en los DTOs usando decoradores, manteniendo la validación cerca de la definición de datos.

**Ventajas Fundamentales**:

**Validación Declarativa**: En lugar de escribir código imperativo de validación (if email is empty, throw error), usamos decoradores:

```typescript
class GoogleUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
```

El código es autoexplicativo y fácil de mantener.

**Validación Automática**: NestJS, mediante ValidationPipe, aplica automáticamente estas validaciones a todos los DTOs de entrada. Si una request no cumple las reglas, se rechaza con 400 Bad Request antes de que llegue al controlador.

**Mensajes de Error Descriptivos**: class-validator genera automáticamente mensajes de error legibles para humanos: "email must be an email", "nombre should not be empty". Estos pueden personalizarse con el parámetro `message` del decorador.

**Validaciones Complejas**: Soporta validaciones avanzadas como @IsEnum(Role), @MinLength(8), @Matches(regex), @IsDateString(), @ValidateNested() (para objetos anidados). Cubren prácticamente cualquier caso de uso sin código custom.

**Transformación de Datos**: Combinado con class-transformer, permite convertir automáticamente strings a números, fechas, etc. Por ejemplo, un query param "page=5" se convierte automáticamente a number 5.

**Validación de Arreglos**: Soporta validar arrays con @IsArray() y @ArrayMinSize(). Útil si en el futuro enviamos listas de usuarios en una sola request.

#### 3.2.2 class-transformer v0.5.1

**Propósito**: Librería para transformar objetos planos en instancias de clase y viceversa.

**Justificación de Elección**:

class-transformer trabaja en conjunto con class-validator para sanitizar y transformar datos entrantes.

**Casos de Uso Específicos**:

**Plain to Class**: Cuando recibimos una request JSON, es un objeto plano de JavaScript. class-transformer lo convierte en una instancia de la clase DTO correspondiente, permitiendo que los decoradores de class-validator funcionen:

```typescript
const dto = plainToClass(GoogleUserDto, request.body);
// dto es ahora una instancia de GoogleUserDto con todos sus métodos y validaciones
```

**Exclusión de Propiedades**: Con @Exclude() podemos marcar campos que no deben ser expuestos en las responses (por ejemplo, passwords hasheados). class-transformer los omite automáticamente al serializar.

**Transformación de Tipos**: Decoradores como @Type(() => Date) convierten automáticamente strings de fecha a objetos Date. Esto evita código manual de parsing.

**Sanitización de Input**: Elimina propiedades no definidas en el DTO (whitelist), previniendo ataques de "mass assignment" donde un atacante envía campos adicionales maliciosos.

**Serialización Consistente**: Garantiza que las responses de la API tengan estructura consistente. Todos los objetos Usuario se serializan con los mismos campos, sin importar cómo fueron creados internamente.

#### 3.2.3 joi v18.0.1

**Propósito**: Librería de validación de esquemas para JavaScript, usada específicamente para variables de entorno.

**Justificación de Elección**:

Mientras class-validator valida DTOs de requests, joi valida la configuración del sistema cargada desde variables de entorno.

**Por qué es crítico**:

**Validación al Inicio**: Con @nestjs/config y joi, validamos las variables de entorno cuando la aplicación arranca. Si falta JWT_SECRET o DATABASE_URL, la aplicación falla inmediatamente con un mensaje claro. Esto previene errores en producción causados por configuración incorrecta.

**Documentación de Configuración**: El schema de joi actúa como documentación de qué variables de entorno se requieren y sus tipos esperados:

```typescript
Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(32),
})
```

Un nuevo desarrollador sabe exactamente qué configurar en su .env.

**Valores por Defecto**: joi permite especificar defaults para variables opcionales. Si PORT no está definido, usa 3000. Esto reduce la configuración necesaria en desarrollo.

**Validación de Formato**: Podemos validar que GOOGLE_CALLBACK_URL es una URL válida, que JWT_EXPIRATION es una duración válida (7d, 1h), etc. Esto previene errores sutiles de configuración.

**Type Safety**: Después de la validación, las variables de entorno están tipadas correctamente en TypeScript. `process.env.PORT` es `number`, no `string | undefined`.

### 3.3 Testing

#### 3.3.1 Jest v30.0.0

**Propósito**: Framework de testing completo para JavaScript/TypeScript.

**Justificación de Elección**:

Jest es el framework de testing más popular en el ecosistema JavaScript, con soporte out-of-the-box para TypeScript, mocking, y cobertura de código.

**Beneficios para el Proyecto**:

**Zero Configuration**: Jest funciona sin configuración compleja. Detecta automáticamente archivos de test (*.spec.ts), ejecuta las pruebas, y genera reportes. Esto reduce la fricción para escribir tests.

**Mocking Integrado**: Jest incluye capacidades poderosas de mocking sin librerías adicionales. Podemos mockear dependencias como PrismaService o JwtService fácilmente:

```typescript
const mockPrisma = {
  usuario: {
    findUnique: jest.fn().mockResolvedValue(mockUser)
  }
};
```

**Matchers Expresivos**: Jest ofrece matchers legibles: `expect(result).toEqual(expected)`, `expect(fn).toHaveBeenCalledWith(args)`, `expect(value).toBeDefined()`. Los tests son casi inglés natural.

**Cobertura de Código**: Con `jest --coverage`, genera reportes HTML detallados mostrando qué líneas, funciones, y ramas están cubiertas por tests. Esto ayuda a identificar código no testeado.

**Snapshot Testing**: Aunque no lo usamos mucho, Jest puede guardar "snapshots" de outputs complejos y detectar cambios inesperados. Útil para DTOs o responses de API.

**Modo Watch**: `jest --watch` reejecuta automáticamente tests cuando el código cambia. Esto acelera el ciclo de desarrollo test-driven (TDD).

**Paralelización**: Jest ejecuta tests en paralelo automáticamente, aprovechando todos los cores del CPU. Esto es crucial cuando el proyecto crece a cientos o miles de tests.

#### 3.3.2 Supertest v7.0.0

**Propósito**: Librería de testing HTTP de alto nivel para Node.js.

**Justificación de Elección**:

Supertest permite hacer tests end-to-end de APIs sin necesidad de levantar un servidor real.

**Casos de Uso Específicos**:

**Tests de Integración**: Verificamos que endpoints completos funcionan correctamente, incluyendo routing, guards, validación, y respuesta. Por ejemplo:

```typescript
request(app.getHttpServer())
  .get('/auth/profile')
  .set('Authorization', `Bearer ${validToken}`)
  .expect(200)
  .expect((res) => {
    expect(res.body.email).toBe('user@example.com');
  });
```

**Sin Servidor Real**: Supertest arranca una instancia temporal de la aplicación en memoria. No necesitamos un puerto HTTP real ni preocuparnos por que el puerto ya esté en uso.

**Assertions Fluídas**: La API encadenada (.get().set().expect()) es muy legible y concisa. Podemos verificar status codes, headers, y body en una sola expresión.

**Testing de Guards**: Verificamos que rutas protegidas rechacen requests sin token válido, que el RolesGuard rechace usuarios sin el rol adecuado, etc. Estos tests aseguran que la seguridad funciona como esperamos.

**Testing de Errores**: Verificamos que errores de validación retornan 400, errores de autorización retornan 403, etc. Esto garantiza que la API cumple las especificaciones HTTP.

### 3.4 Desarrollo y Calidad de Código

#### 3.4.1 ESLint v9.18.0

**Propósito**: Linter para JavaScript/TypeScript que detecta problemas de código y enforza estilos.

**Justificación de Elección**:

ESLint es esencial para mantener calidad y consistencia de código en un equipo.

**Reglas Aplicadas y Razones**:

**Detección de Bugs**: ESLint detecta problemas comunes como variables no usadas, imports no utilizados, comparaciones con == en lugar de ===. Estos pueden ser bugs sutiles.

**Estilo Consistente**: Enforza convenciones como usar const en lugar de let cuando es posible, prefer arrow functions, etc. El código del equipo se ve uniforme sin importar quién lo escribió.

**Mejores Prácticas**: Previene anti-patterns como modificar parámetros de función, usar eval(), o catch blocks vacíos. Estas reglas previenen código propenso a bugs.

**TypeScript Specific**: @typescript-eslint añade reglas específicas para TypeScript como preferir interfaces sobre types, evitar `any` explícito, etc.

**Integración con IDE**: VSCode muestra errores de ESLint en tiempo real mientras escribes. Puedes aplicar fixes automáticamente con un shortcut. Esto mejora la productividad.

**CI/CD Integration**: En el pipeline, ejecutamos `npm run lint` para bloquear merges de código que no cumple las reglas. Esto garantiza que código problemático no llegue a producción.

#### 3.4.2 Prettier v3.4.2

**Propósito**: Formateador de código opinionado para mantener estilo consistente.

**Justificación de Elección**:

Prettier complementa ESLint enfocándose exclusivamente en formato (espacios, saltos de línea, etc.).

**Ventajas Específicas**:

**Cero Configuración**: Prettier tiene opiniones fuertes sobre cómo debe verse el código. Esto elimina debates en el equipo sobre si usar tabs o espacios, dónde poner llaves, etc.

**Formato Automático**: Con la extensión de VSCode, el código se formatea automáticamente al guardar. Nunca tenemos que pensar en formato manualmente.

**Consistencia Absoluta**: Todo el código del proyecto se ve idéntico. Esto facilita revisiones de código porque los cambios de formato no contaminan los diffs.

**Reduce Merge Conflicts**: Como todo el equipo usa el mismo formato, hay menos conflictos de formato en merges. Los conflictos que ocurren son de lógica, no de estilo.

**Integración con Git Hooks**: Usamos husky + lint-staged para ejecutar Prettier automáticamente antes de cada commit. El código mal formateado nunca llega al repositorio.

**Compatibilidad con ESLint**: Prettier se integra con ESLint vía eslint-config-prettier, que desactiva reglas de ESLint que conflictúan con el formato de Prettier.

#### 3.4.3 ts-node v10.9.2

**Propósito**: Ejecutor de TypeScript para Node.js sin precompilación.

**Justificación de Elección**:

ts-node permite ejecutar archivos TypeScript directamente sin compilarlos a JavaScript primero.

**Casos de Uso**:

**Scripts de Base de Datos**: Ejecutamos seeders y migraciones con ts-node directamente: `ts-node prisma/seed.ts`. Sin ts-node, tendríamos que compilar a JavaScript cada vez.

**Testing**: Jest usa ts-node internamente para ejecutar tests escritos en TypeScript. Esto acelera el ciclo de desarrollo.

**Desarrollo Rápido**: En modo watch (`npm run start:dev`), NestJS usa ts-node para recargar cambios sin compilación completa. Los cambios se reflejan en segundos.

**Scripts de Utilidad**: Cualquier script de automatización (migraciones de datos, generación de reportes) puede escribirse en TypeScript con acceso a todos los tipos del proyecto.

### 3.5 Documentación

#### 3.5.1 @nestjs/swagger

**Propósito**: Generación automática de documentación OpenAPI/Swagger.

**Justificación de Elección**:

Swagger proporciona documentación interactiva de la API que es invaluable para consumidores del servicio.

**Beneficios Clave**:

**Documentación Automática**: Los decoradores de NestJS (@Get, @Post, @Body) se usan para generar automáticamente la documentación. No hay documentación separada que pueda desincronizarse del código.

**Especificación de Respuestas**: Con @ApiResponse(), documentamos los códigos de estado posibles y sus estructuras:

```typescript
@ApiResponse({ status: 200, description: 'Login exitoso', type: AuthResponseDto })
@ApiResponse({ status: 401, description: 'Credenciales inválidas' })
```

Los consumidores saben exactamente qué esperar.

**Interfaz Interactiva**: En /api/docs, los desarrolladores pueden probar endpoints directamente desde el navegador. Pueden autenticarse con tokens, ver ejemplos de responses, y experimentar con parámetros.

**Esquemas de DTOs**: Los DTOs se documentan automáticamente con @ApiProperty(). Cada campo se describe con su tipo, si es requerido, ejemplos, etc.

**Autenticación en Swagger**: Con @ApiBearer Auth(), agregamos un botón "Authorize" donde pegar el JWT. Todos los endpoints protegidos usan este token automáticamente en las pruebas.

**Exportación OpenAPI**: La especificación generada es OpenAPI 3.0 estándar. Puede importarse en herramientas como Postman, Insomnia, o usarse para generar clientes en otros lenguajes.

**Versionado de API**: Cuando versionamos la API (v1, v2), Swagger puede documentar múltiples versiones simultáneamente. Los consumidores eligen qué versión usar.

---

## RESUMEN DE DECISIONES TECNOLÓGICAS

| Categoría | Tecnología Seleccionada | Alternativas Consideradas | Razón Principal de Elección |
|-----------|------------------------|---------------------------|----------------------------|
| **Lenguaje** | TypeScript 5.7.3 | JavaScript, Flow | Type safety, mejor DX, refactoring seguro |
| **Framework** | NestJS 11.0.1 | Express, Fastify, Koa | Arquitectura escalable, DI nativa, decoradores |
| **Base de Datos** | PostgreSQL 14+ | MySQL, MongoDB, SQLite | Relacional, ACID, tipos avanzados |
| **ORM** | Prisma 6.19.0 | TypeORM, Sequelize, SQL crudo | Type-safe queries, migraciones auto, mejor DX |
| **Auth Middleware** | Passport 0.7.0 | Implementación custom | Estándar industria, estrategias pluggables |
| **OAuth Provider** | Google OAuth 2.0 | Auth0, Okta, Cognito | Gratuito, familiar usuarios, fácil setup |
| **JWT** | @nestjs/jwt 11.0.1 | jsonwebtoken directo | Integración NestJS, configuración global |
| **Validación** | class-validator 0.14.2 | Joi, Yup, Zod | Decoradores, integración NestJS, declarativo |
| **Testing** | Jest 30.0.0 | Mocha, Vitest, Jasmine | Zero config, mocking integrado, cobertura |
| **Linting** | ESLint 9.18.0 | TSLint (deprecated), Biome | Estándar de facto, plugins TypeScript |
| **Formatting** | Prettier 3.4.2 | ESLint autofixing | Opinionado, formato automático, cero debates |
| **Documentación** | Swagger/OpenAPI | Postman, API Blueprint | Interactivo, OpenAPI estándar, auto-generado |

---

## 4. DIAGRAMA Y EXPLICACIÓN DE BASE DE DATOS

### 4.1 Esquema de Base de Datos

El módulo `wise_auth` utiliza un esquema de base de datos relacional implementado en PostgreSQL a través de Prisma ORM. El diseño prioriza la normalización, integridad referencial, y escalabilidad.

#### 4.1.1 Modelo Entidad-Relación

```
┌─────────────────┐           ┌──────────────────┐
│      Rol        │           │ EstadoUsuario    │
├─────────────────┤           ├──────────────────┤
│ id (PK)         │◄──────┐   │ id (PK)          │◄────┐
│ nombre (UNIQUE) │       │   │ nombre (UNIQUE)  │     │
│ descripcion     │       │   │ descripcion      │     │
│ activo          │       │   │ activo           │     │
│ created_at      │       │   │ created_at       │     │
│ updated_at      │       │   │ updated_at       │     │
└─────────────────┘       │   └──────────────────┘     │
                          │                            │
                          │   ┌──────────────────────────────────────┐
                          │   │          Usuario                     │
                          │   ├──────────────────────────────────────┤
                          └───┤ rol_id (FK)                          │
                              │ estado_id (FK)                       │───┘
                              ├──────────────────────────────────────┤
                              │ id (PK, UUID)                        │
                              │ email (UNIQUE)                       │
                              │ nombre                               │
                              │ apellido                             │
                              │ telefono (NULL)                      │
                              │ biografia (NULL)                     │
                              │ semestre (DEFAULT 1)                 │
                              │ google_id (UNIQUE, NULL)             │
                              │ avatar_url (NULL)                    │
                              │ ultimo_login (NULL)                  │
                              │ disponibilidad (JSON, NULL)          │
                              │ created_at                           │
                              │ updated_at                           │
                              └──────────────────────────────────────┘
```

### 4.2 Descripción Detallada de Tablas

#### 4.2.1 Tabla: `roles`

**Propósito**: Tabla catálogo que define los tipos de usuarios en el sistema.

**Estructura**:

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identificador único del rol |
| `nombre` | VARCHAR | UNIQUE, NOT NULL | Nombre del rol (estudiante, tutor, admin) |
| `descripcion` | TEXT | NULLABLE | Descripción legible del rol |
| `activo` | BOOLEAN | NOT NULL, DEFAULT true | Indica si el rol está activo en el sistema |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO UPDATE | Fecha de última actualización |

**Datos Semilla (Seed Data)**:
```sql
INSERT INTO roles (id, nombre, descripcion) VALUES
  (1, 'estudiante', 'Usuario estudiante con permisos básicos'),
  (2, 'tutor', 'Usuario tutor con permisos para dar tutorías'),
  (3, 'admin', 'Administrador con permisos completos');
```

**Razones de Diseño**:

- **ID Numérico vs UUID**: Se usa INTEGER para `id` porque es una tabla catálogo pequeña (3-5 registros). Los IDs numéricos son más eficientes para joins frecuentes y ocupan menos espacio.

- **Campo `activo`**: Permite desactivar roles sin eliminarlos, preservando integridad referencial. Por ejemplo, si eliminamos el rol "tutor", ¿qué hacemos con los usuarios existentes?

- **UNIQUE en `nombre`**: Previene duplicados accidentales. El nombre del rol se usa en comparaciones de código (`if (user.rol === 'admin')`), por lo que debe ser único.

- **Timestamps Auditables**: `created_at` y `updated_at` permiten auditar cuándo se crearon o modificaron roles, útil para cumplimiento normativo.

#### 4.2.2 Tabla: `estados_usuario`

**Propósito**: Tabla catálogo que define los estados posibles de una cuenta de usuario.

**Estructura**:

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Identificador único del estado |
| `nombre` | VARCHAR | UNIQUE, NOT NULL | Nombre del estado (activo, inactivo, suspendido) |
| `descripcion` | TEXT | NULLABLE | Descripción del estado |
| `activo` | BOOLEAN | NOT NULL, DEFAULT true | Indica si el estado está en uso |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO UPDATE | Fecha de actualización |

**Datos Semilla**:
```sql
INSERT INTO estados_usuario (id, nombre, descripcion) VALUES
  (1, 'activo', 'Usuario activo y con acceso completo'),
  (2, 'inactivo', 'Usuario inactivo temporalmente'),
  (3, 'suspendido', 'Usuario suspendido por violación de políticas');
```

**Razones de Diseño**:

- **Separación de Roles y Estados**: Un usuario puede estar "suspendido" temporalmente sin perder su rol de "tutor". Estas son dimensiones independientes.

- **Extensibilidad**: Podemos agregar estados futuros como "pendiente_verificacion" o "bloqueado_por_intentos_fallidos" sin modificar el schema de Usuario.

- **Auditoría**: Si un usuario es suspendido, el campo `updated_at` registra cuándo ocurrió, facilitando investigaciones.

#### 4.2.3 Tabla: `usuarios`

**Propósito**: Tabla principal que almacena la información de todos los usuarios del sistema.

**Estructura Completa**:

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único global del usuario |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Email del usuario (institucional) |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre(s) del usuario |
| `apellido` | VARCHAR(100) | NOT NULL | Apellido(s) del usuario |
| `telefono` | VARCHAR(20) | NULLABLE | Teléfono de contacto (opcional) |
| `biografia` | TEXT | NULLABLE | Biografía o descripción del usuario |
| `semestre` | INTEGER | NOT NULL, DEFAULT 1 | Semestre académico actual (1-10) |
| `google_id` | VARCHAR(255) | UNIQUE, NULLABLE, INDEX | ID único de Google OAuth |
| `avatar_url` | VARCHAR(500) | NULLABLE | URL de la foto de perfil de Google |
| `rol_id` | INTEGER | NOT NULL, DEFAULT 1, FOREIGN KEY → roles(id), INDEX | Referencia al rol del usuario |
| `estado_id` | INTEGER | NOT NULL, DEFAULT 1, FOREIGN KEY → estados_usuario(id), INDEX | Referencia al estado de la cuenta |
| `ultimo_login` | TIMESTAMP | NULLABLE | Fecha y hora del último inicio de sesión |
| `disponibilidad` | JSONB | NULLABLE | Horarios de disponibilidad (para tutores) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación de la cuenta |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO UPDATE | Fecha de última modificación |

**Índices Adicionales**:
```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_usuarios_estado_id ON usuarios(estado_id);
CREATE INDEX idx_usuarios_created_at ON usuarios(created_at DESC);
```

**Razones de Diseño Detalladas**:

**UUID como Primary Key**:
- **Ventaja**: Los UUIDs son globalmente únicos sin coordinación. Si en el futuro necesitamos sincronizar con otros sistemas o permitir registros offline, no hay riesgo de colisiones de IDs.
- **Ventaja**: Los UUIDs no revelan información sobre el número de usuarios (vs IDs incrementales que sí lo hacen: user/12345 → hay al menos 12,345 usuarios).
- **Desventaja**: Ocupan 16 bytes vs 4 bytes de un INTEGER. Sin embargo, PostgreSQL maneja UUIDs eficientemente con índices B-tree.

**Email como UNIQUE**:
- Un usuario solo puede tener una cuenta por email.
- El índice UNIQUE acelera las búsquedas durante login (operación crítica de performance).
- PostgreSQL usa el índice UNIQUE automáticamente en queries con `WHERE email = ?`.

**google_id como UNIQUE y NULLABLE**:
- UNIQUE garantiza que no hay dos cuentas vinculadas al mismo usuario de Google.
- NULLABLE permite usuarios que no usen Google OAuth (si agregamos métodos de autenticación alternativos en el futuro).
- Índice separado porque las búsquedas por google_id ocurren en cada callback de OAuth.

**Campos de Auditoría (created_at, updated_at, ultimo_login)**:
- `created_at`: Permite análisis de crecimiento de usuarios ("¿cuántos usuarios se registraron este mes?").
- `updated_at`: Rastrea cambios de perfil, útil para detectar actividad sospechosa.
- `ultimo_login`: Identifica usuarios inactivos para campañas de reactivación o limpieza de datos.

**Campo disponibilidad (JSONB)**:
- Almacena horarios complejos sin crear tablas adicionales.
- Formato esperado:
```json
{
  "monday": [
    {"start": "09:00", "end": "11:00", "modalidad": "VIRTUAL"},
    {"start": "14:00", "end": "16:00", "modalidad": "PRESENCIAL"}
  ],
  "tuesday": [],
  "wednesday": [...]
}
```
- JSONB (vs JSON) permite indexar y consultar dentro del JSON con operadores específicos de PostgreSQL.
- Flexible para cambios futuros (agregar campos como "ubicacion", "zoom_link") sin migrar schema.

**Foreign Keys con ON DELETE RESTRICT (default)**:
- Si intentamos eliminar un rol que tiene usuarios, PostgreSQL rechaza la operación.
- Esto previene pérdida accidental de datos. Debemos reasignar usuarios antes de eliminar roles.

**Defaults Inteligentes**:
- `rol_id = 1` (estudiante): Nuevos usuarios tienen permisos mínimos por defecto (principio de least privilege).
- `estado_id = 1` (activo): Las cuentas nuevas son usables inmediatamente sin aprobación manual.
- `semestre = 1`: Asumimos que nuevos registros son estudiantes de primer semestre (ajustable manualmente después).

### 4.3 Relaciones Entre Tablas

#### 4.3.1 Usuario → Rol (Many-to-One)

**Cardinalidad**: Muchos usuarios pueden tener el mismo rol, pero cada usuario tiene exactamente un rol.

**Implementación**:
```prisma
model Usuario {
  rolId Int @default(1) @map("rol_id")
  rol   Rol @relation(fields: [rolId], references: [id])
}

model Rol {
  id       Int       @id @default(autoincrement())
  usuarios Usuario[]
}
```

**Query Ejemplo**:
```typescript
// Obtener usuario con su rol
const user = await prisma.usuario.findUnique({
  where: { email: 'user@example.com' },
  include: { rol: true }
});
// user.rol.nombre === 'estudiante'

// Obtener todos los usuarios con rol 'tutor'
const tutores = await prisma.usuario.findMany({
  where: { rol: { nombre: 'tutor' } }
});
```

**Impacto en Performance**: El índice en `rol_id` hace que estas queries sean O(log n) en lugar de O(n).

#### 4.3.2 Usuario → EstadoUsuario (Many-to-One)

**Cardinalidad**: Muchos usuarios pueden tener el mismo estado, pero cada usuario tiene exactamente un estado.

**Implementación**: Similar a la relación con Rol.

**Casos de Uso**:
- Listar usuarios activos: `WHERE estado_id = 1`
- Suspender usuario: `UPDATE usuarios SET estado_id = 3 WHERE id = ?`
- Filtrar usuarios inactivos en reportes

### 4.4 Migraciones y Evolución del Schema

El proyecto usa Prisma Migrate para gestionar cambios en el schema de manera versionada y reproducible.

**Proceso de Migración**:

1. **Modificar schema.prisma**: Agregar/modificar/eliminar campos
2. **Generar migración**: `npx prisma migrate dev --name agregar_campo_biografia`
3. **Revisar SQL generado**: Prisma crea archivos SQL en `/prisma/migrations/`
4. **Aplicar en desarrollo**: La migración se aplica automáticamente
5. **Aplicar en producción**: `npx prisma migrate deploy`

**Ejemplo de Migración Generada**:
```sql
-- Migration: 20241201_agregar_campo_biografia
BEGIN;

ALTER TABLE "usuarios" ADD COLUMN "biografia" TEXT;

COMMIT;
```

**Ventajas del Enfoque**:
- **Versionado**: Cada cambio es rastreado en Git
- **Reproducible**: Cualquier desarrollador puede replicar el estado exacto de la BD
- **Rollback**: Podemos revertir migraciones problemáticas
- **Documentación**: Las migraciones documentan la evolución del schema

### 4.5 Consideraciones de Seguridad en Base de Datos

**Principio de Least Privilege**:
- La aplicación se conecta con un usuario de BD que solo tiene permisos SELECT, INSERT, UPDATE en las tablas necesarias.
- No tiene permisos DROP, TRUNCATE, o acceso a tablas del sistema.

**Conexiones Seguras**:
- `DATABASE_URL` incluye `?sslmode=require` para encriptar conexiones.
- Las credenciales se almacenan en variables de entorno, nunca en código.

**Protección contra SQL Injection**:
- Prisma usa parámetros preparados automáticamente en todas las queries.
- No existe concatenación de strings SQL en el código.

**Backups Automáticos**:
- Supabase (nuestro proveedor) realiza backups diarios automáticos.
- Se retienen por 7 días, permitiendo recuperación de desastres.

---

## 5. DIAGRAMA Y EXPLICACIÓN DE CLASES CON DTOs Y PATRONES UTILIZADOS

### 5.1 Estructura de Clases del Módulo

El módulo `wise_auth` está organizado siguiendo el patrón arquitectónico de **NestJS Module-Controller-Service**, con capas adicionales para Guards, Strategies, y DTOs.

```
┌─────────────────────────────────────────────────────────────────┐
│                         AuthModule                              │
│  (Contenedor de IoC que registra todos los providers)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┬────────────────┐
         ▼                               ▼                ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────┐
│ AuthController   │          │  AuthService     │  │ PrismaService│
│ (Capa HTTP)      │──────────│  (Lógica negocio)│──│ (Data Access)│
└──────────────────┘          └──────────────────┘  └──────────────┘
         │                               │
         │                               ▼
         │                    ┌─────────────────────┐
         │                    │ ServiceBusClient    │
         │                    │ (Mensajería Azure)  │
         │                    └─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Guards (Interceptores)                   │
├─────────────────┬─────────────────────┬─────────────────────────┤
│ GoogleAuthGuard │   JwtAuthGuard      │     RolesGuard          │
│ (OAuth flow)    │   (Valida JWT)      │   (Valida permisos)     │
└─────────────────┴─────────────────────┴─────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ GoogleStrategy  │  │  JwtStrategy    │
│ (Passport)      │  │  (Passport)     │
└─────────────────┘  └─────────────────┘
```

### 5.2 Descripción Detallada de Clases Principales

#### 5.2.1 AuthController

**Responsabilidad**: Capa de presentación HTTP. Recibe requests, las valida, las delega al servicio, y retorna responses formateadas.

**Ubicación**: `src/auth/auth.controller.ts`

**Métodos Públicos**:

```typescript
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Ruta pública que inicia el flujo OAuth
  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void>

  // Callback de Google (protegido por GoogleAuthGuard)
  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: RequestWithGoogleUser,
    @Res() res: Response
  ): Promise<void>

  // Obtener perfil del usuario autenticado
  @Get('profile')
  @Roles(Role.ESTUDIANTE, Role.TUTOR, Role.ADMIN)
  async getProfile(@GetUser() user: JwtPayload): Promise<Usuario>

  // Health check del servicio
  @Get('health')
  @Public()
  async healthCheck(): Promise<{ status: string }>
}
```

**Patrones Aplicados**:

1. **Dependency Injection**: `AuthService` se inyecta en el constructor. NestJS resuelve la dependencia automáticamente.

2. **Decoradores de Ruta**: `@Get()`, `@Post()` son decoradores que definen el método HTTP y la ruta.

3. **Guard-Based Authorization**: `@UseGuards()` aplica validaciones antes de ejecutar el método.

4. **Custom Decorators**: `@Public()` marca rutas sin autenticación, `@Roles()` especifica roles requeridos, `@GetUser()` extrae el usuario del request.

5. **DTOs para Type Safety**: Los parámetros de métodos usan DTOs tipados que garantizan validación automática.

**Flujo de Request**:
```
1. Request HTTP llega al controlador
   ↓
2. NestJS aplica Guards globales (JwtAuthGuard)
   ↓
3. Si hay @Public(), se salta la validación JWT
   ↓
4. Si hay @Roles(), RolesGuard verifica permisos
   ↓
5. ValidationPipe valida DTOs de entrada
   ↓
6. Se ejecuta el método del controlador
   ↓
7. El controlador llama al servicio
   ↓
8. El servicio retorna resultado
   ↓
9. El controlador formatea y retorna response
```

#### 5.2.2 AuthService

**Responsabilidad**: Lógica de negocio de autenticación. Orquesta la validación de usuarios, generación de tokens, y persistencia de datos.

**Ubicación**: `src/auth/auth.service.ts`

**Métodos Principales**:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private serviceBusClient: ServiceBusClient
  ) {}

  // Valida y procesa un usuario de Google OAuth
  async validateGoogleUser(googleUserDto: GoogleUserDto): Promise<AuthResponseDto>

  // Busca un usuario por su Google ID
  async findUserByGoogleId(googleId: string): Promise<Usuario | null>

  // Busca un usuario por email
  async findUserByEmail(email: string): Promise<Usuario | null>

  // Genera un token JWT para un usuario
  private generateJwtToken(user: Usuario): string

  // Envía notificación de nuevo usuario al Service Bus
  private async sendNotificacionNuevoUsuario(
    email: string, 
    nombreCompleto: string, 
    userId: string
  ): Promise<void>
}
```

**Implementación de validateGoogleUser** (método crítico):

```typescript
async validateGoogleUser(googleUserDto: GoogleUserDto): Promise<AuthResponseDto> {
  this.logger.log(`Validando usuario de Google: ${googleUserDto.email}`);

  // 1. Buscar usuario existente por Google ID
  let user = await this.findUserByGoogleId(googleUserDto.googleId);

  if (user) {
    // Usuario existente: actualizar último login y avatar
    this.logger.log(`Usuario encontrado: ${user.email}`);
    
    user = await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        ultimo_login: new Date(),
        avatar_url: googleUserDto.avatarUrl, // Actualizar foto de perfil
      },
      include: {
        rol: true,
        estado: true,
      },
    });
  } else {
    // Usuario nuevo: crear cuenta con valores por defecto
    this.logger.log(`Creando nuevo usuario: ${googleUserDto.email}`);

    user = await this.prisma.usuario.create({
      data: {
        email: googleUserDto.email,
        nombre: googleUserDto.nombre,
        apellido: googleUserDto.apellido,
        google_id: googleUserDto.googleId,
        avatar_url: googleUserDto.avatarUrl,
        rolId: 1,      // Rol "estudiante" por defecto
        estadoId: 1,   // Estado "activo" por defecto
        ultimo_login: new Date(),
      },
      include: {
        rol: true,
        estado: true,
      },
    });

    // Enviar evento de "nuevo usuario" a otros microservicios
    await this.sendNotificacionNuevoUsuario(
      user.email, 
      `${user.nombre} ${user.apellido}`, 
      user.id
    );
  }

  // 2. Generar token JWT
  const payload = {
    sub: user.id,
    email: user.email,
    rol: user.rol.nombre, // 'estudiante', 'tutor', o 'admin'
  };

  const access_token = this.jwtService.sign(payload);

  // 3. Retornar respuesta con token y datos de usuario
  return {
    access_token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol.nombre,
      avatarUrl: user.avatar_url,
    },
  };
}
```

**Patrones Aplicados**:

1. **Service Layer Pattern**: Toda la lógica de negocio está encapsulada en el servicio, no en el controlador.

2. **Repository Pattern (implícito)**: PrismaService actúa como repositorio, abstrayendo el acceso a datos.

3. **Factory Pattern**: El método `generateJwtToken` es un factory que crea tokens JWT estandarizados.

4. **Event-Driven Architecture**: Usa Service Bus para emitir eventos cuando ocurren cambios importantes (nuevo usuario).

5. **Separation of Concerns**: El servicio no sabe nada de HTTP (requests, responses). Trabaja con DTOs puros.

#### 5.2.3 GoogleStrategy

**Responsabilidad**: Estrategia de Passport que implementa el flujo OAuth 2.0 con Google.

**Ubicación**: `src/auth/strategies/google.strategy.ts`

**Implementación**:

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: envs.googleClientId,
      clientSecret: envs.googleClientSecret,
      callbackURL: envs.googleCallbackUrl,
      scope: ['email', 'profile'], // Permisos solicitados
    });
  }

  // Método llamado por Passport cuando Google retorna el perfil
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<GoogleUserDto> {
    const { id, name, emails, photos } = profile;

    // Extraer email principal
    const email = emails && emails.length > 0 ? emails[0].value : null;

    if (!email) {
      throw new UnauthorizedException('No se pudo obtener el email de Google');
    }

    // Transformar perfil de Google a nuestro DTO
    return {
      googleId: id,
      email: email,
      nombre: name.givenName || '',
      apellido: name.familyName || '',
      avatarUrl: photos && photos.length > 0 ? photos[0].value : null,
    };
  }
}
```

**Flujo OAuth Completo**:

```
1. Usuario hace click en "Login con Google"
   ↓
2. Frontend redirige a GET /auth/google
   ↓
3. GoogleAuthGuard activa GoogleStrategy
   ↓
4. GoogleStrategy redirige a Google OAuth
   https://accounts.google.com/o/oauth2/auth?client_id=...
   ↓
5. Usuario autoriza la aplicación en Google
   ↓
6. Google redirige a /auth/google/callback?code=AUTHORIZATION_CODE
   ↓
7. GoogleStrategy intercambia el code por access_token (automático)
   ↓
8. GoogleStrategy obtiene perfil del usuario (automático)
   ↓
9. GoogleStrategy llama a validate() con el perfil
   ↓
10. validate() retorna GoogleUserDto
   ↓
11. Passport adjunta el DTO a request.user
   ↓
12. AuthController.googleAuthCallback() procesa el usuario
```

**Patrones Aplicados**:

1. **Strategy Pattern**: Passport permite cambiar estrategias (Google, Facebook, Twitter) sin modificar código dependiente.

2. **Template Method Pattern**: Passport define el flujo OAuth, nosotros solo implementamos `validate()`.

3. **Adapter Pattern**: GoogleStrategy adapta el formato de perfil de Google a nuestro formato interno (GoogleUserDto).

#### 5.2.4 JwtStrategy

**Responsabilidad**: Estrategia de Passport que valida tokens JWT en requests protegidos.

**Ubicación**: `src/auth/strategies/jwt.strategy.ts`

**Implementación**:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  // Método llamado cuando el JWT es válido
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // payload contiene: { sub: userId, email, rol }

    // Validación adicional: verificar que el usuario aún existe
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { estado: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.estado.nombre !== 'activo') {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Retornar payload enriquecido
    return {
      sub: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
```

**Patrones Aplicados**:

1. **Validation Pattern**: El método `validate()` realiza validaciones de negocio adicionales más allá de la validación criptográfica del token.

2. **Fail-Fast Pattern**: Si el usuario está inactivo, la request falla inmediatamente sin ejecutar lógica de negocio.

3. **Enrichment Pattern**: Aunque no lo usamos actualmente, podríamos enriquecer el payload con información adicional de BD antes de retornarlo.

#### 5.2.5 Guards (JwtAuthGuard, RolesGuard, GoogleAuthGuard)

**Responsabilidad**: Interceptores que validan condiciones antes de permitir acceso a un endpoint.

**JwtAuthGuard** (`src/auth/guards/jwt-auth.guard.ts`):

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Verificar si la ruta está marcada como @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Saltar validación JWT
    }

    // Ejecutar validación JWT normal (llama a JwtStrategy)
    return super.canActivate(context);
  }
}
```

**RolesGuard** (`src/auth/guards/roles.guard.ts`):

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Sin restricción de roles
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Inyectado por JwtAuthGuard

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = requiredRoles.some(role => 
      user.rol.toLowerCase() === role.toLowerCase()
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
```

**Patrones Aplicados**:

1. **Chain of Responsibility**: Los guards se ejecutan en cadena. JwtAuthGuard → RolesGuard → Método del controlador.

2. **Guard Pattern**: Valida precondiciones antes de ejecutar lógica. Si falla, la request se rechaza inmediatamente.

3. **Decorator Pattern**: Los guards se aplican declarativamente con `@UseGuards()`, decorando métodos.

4. **Reflection Pattern**: Usan `Reflector` para leer metadatos de decoradores (@Public, @Roles).

### 5.3 DTOs (Data Transfer Objects)

Los DTOs definen la estructura de datos que fluye entre capas. Garantizan type-safety y validación automática.

#### 5.3.1 GoogleUserDto

**Propósito**: Datos extraídos del perfil de Google OAuth.

**Ubicación**: `src/auth/dto/google-user.dto.ts`

**Implementación**:

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserDto {
  @ApiProperty({
    description: 'ID único del usuario en Google',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({
    description: 'Email del usuario verificado por Google',
    example: 'user@university.edu',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({
    description: 'URL de la foto de perfil de Google',
    example: 'https://lh3.googleusercontent.com/a/...',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
```

**Validaciones Aplicadas**:

| Campo | Validaciones | Razón |
|-------|-------------|-------|
| `googleId` | @IsString, @IsNotEmpty | Google siempre retorna un ID string no vacío |
| `email` | @IsEmail, @IsNotEmpty | Debe ser un email válido para identificación |
| `nombre` | @IsString, @IsNotEmpty | Requerido para personalización |
| `apellido` | @IsString, @IsNotEmpty | Requerido para nombre completo |
| `avatarUrl` | @IsString, @IsOptional | Google puede no proporcionar foto |

**Patrón Aplicado**: **DTO Pattern** - Objeto diseñado exclusivamente para transferir datos entre procesos sin lógica de negocio.

#### 5.3.2 AuthResponseDto

**Propósito**: Respuesta de autenticación exitosa con token y datos de usuario.

**Ubicación**: `src/auth/dto/auth-response.dto.ts`

**Implementación**:

```typescript
import { ApiProperty } from '@nestjs/swagger';

class UserDataDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@university.edu',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  apellido: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    example: 'estudiante',
    enum: ['estudiante', 'tutor', 'admin'],
  })
  rol: string;

  @ApiProperty({
    description: 'URL de la foto de perfil',
    example: 'https://lh3.googleusercontent.com/a/...',
    required: false,
  })
  avatarUrl?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticación en requests subsecuentes',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserDataDto,
  })
  user: UserDataDto;
}
```

**Estructura de Response Completo**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAdW5pdmVyc2l0eS5lZHUiLCJyb2wiOiJlc3R1ZGlhbnRlIiwiaWF0IjoxNzAxMDAwMDAwLCJleHAiOjE3MDE2MDQ4MDB9.signature",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@university.edu",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "estudiante",
    "avatarUrl": "https://lh3.googleusercontent.com/a/default-user"
  }
}
```

**Patrón Aplicado**: **Composite DTO Pattern** - DTO que contiene otro DTO (`UserDataDto`), permitiendo estructuras anidadas.

#### 5.3.3 JwtPayload (Interface)

**Propósito**: Estructura del payload dentro del token JWT.

**Ubicación**: `src/auth/interfaces/jwt-payload.interface.ts`

**Implementación**:

```typescript
export interface JwtPayload {
  sub: string;    // Subject: ID del usuario
  email: string;  // Email del usuario
  rol: string;    // Rol del usuario ('estudiante', 'tutor', 'admin')
  iat?: number;   // Issued At: timestamp de emisión (agregado por JWT)
  exp?: number;   // Expiration: timestamp de expiración (agregado por JWT)
}
```

**Ejemplo de JWT Decodificado**:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@university.edu",
  "rol": "tutor",
  "iat": 1701000000,
  "exp": 1701604800
}
```

**Claims Estándar vs Custom**:

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `sub` (Standard) | string | Subject identifier (user ID) |
| `iat` (Standard) | number | Issued at timestamp |
| `exp` (Standard) | number | Expiration timestamp |
| `email` (Custom) | string | Email del usuario |
| `rol` (Custom) | string | Rol para autorización |

**Patrón Aplicado**: **Value Object Pattern** - Objeto inmutable que representa un concepto del dominio (identidad del usuario).

### 5.4 Enums

#### 5.4.1 Role Enum

**Propósito**: Enumerar los roles posibles del sistema, garantizando type-safety.

**Ubicación**: `src/auth/enums/role.enum.ts`

**Implementación**:

```typescript
export enum Role {
  ESTUDIANTE = 'estudiante',
  TUTOR = 'tutor',
  ADMIN = 'admin',
}
```

**Uso en Código**:

```typescript
// En lugar de strings mágicos:
if (user.rol === 'admin') { ... } // ❌ Propenso a typos

// Usamos el enum:
if (user.rol === Role.ADMIN) { ... } // ✅ Type-safe, autocompletado
```

**Ventajas**:

1. **Type Safety**: El compilador valida que solo usamos roles válidos.
2. **Autocompletado**: El IDE sugiere los valores posibles.
3. **Refactoring**: Si renombramos un rol, el compilador encuentra todos los usos.
4. **Documentación**: El enum actúa como documentación de roles disponibles.

### 5.5 Decoradores Personalizados

#### 5.5.1 @Public()

**Propósito**: Marcar rutas que no requieren autenticación JWT.

**Ubicación**: `src/auth/decorators/public.decorator.ts`

**Implementación**:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Uso**:

```typescript
@Get('google')
@Public() // Esta ruta no requiere JWT
async googleAuth() { ... }
```

**Patrón Aplicado**: **Metadata Decoration Pattern** - Adjunta metadatos a métodos que son leídos por guards en runtime.

#### 5.5.2 @Roles()

**Propósito**: Especificar qué roles pueden acceder a una ruta.

**Ubicación**: `src/auth/decorators/roles.decorator.ts`

**Implementación**:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**Uso**:

```typescript
@Get('admin-panel')
@Roles(Role.ADMIN) // Solo admins
async adminPanel() { ... }

@Get('tutoria')
@Roles(Role.TUTOR, Role.ADMIN) // Tutores o admins (OR lógico)
async gestionarTutoria() { ... }
```

**Patrón Aplicado**: **Varargs Pattern** - Acepta cantidad variable de argumentos (`...roles`).

#### 5.5.3 @GetUser()

**Propósito**: Extraer el usuario autenticado del request.

**Ubicación**: `src/auth/decorators/get-user.decorator.ts`

**Implementación**:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Inyectado por JwtAuthGuard
  },
);
```

**Uso**:

```typescript
@Get('profile')
async getProfile(@GetUser() user: JwtPayload) {
  // user contiene { sub, email, rol }
  return user;
}
```

**Patrón Aplicado**: **Parameter Decorator Pattern** - Inyecta datos en parámetros de métodos de manera declarativa.

### 5.6 Resumen de Patrones de Diseño Aplicados

| Patrón | Dónde se Aplica | Beneficio |
|--------|-----------------|-----------|
| **Module Pattern** | AuthModule, PrismaModule | Encapsulación y organización |
| **Dependency Injection** | Todos los @Injectable | Desacoplamiento, testabilidad |
| **Repository Pattern** | PrismaService | Abstracción de acceso a datos |
| **Service Layer Pattern** | AuthService | Lógica de negocio centralizada |
| **Strategy Pattern** | GoogleStrategy, JwtStrategy | Algoritmos intercambiables |
| **Guard Pattern** | JwtAuthGuard, RolesGuard | Validación de precondiciones |
| **DTO Pattern** | GoogleUserDto, AuthResponseDto | Transferencia de datos tipada |
| **Factory Pattern** | JwtService.sign() | Creación estandarizada de tokens |
| **Decorator Pattern** | @Public, @Roles, @GetUser | Metaprogramación declarativa |
| **Chain of Responsibility** | Guards pipeline | Procesamiento secuencial |
| **Template Method** | PassportStrategy | Framework defines flow, we implement details |
| **Adapter Pattern** | GoogleStrategy.validate() | Adapta formato Google a nuestro DTO |

---

## 6. DIAGRAMA DE ARQUITECTURA UTILIZADA

### 6.1 Patrón de Arquitectura: Microservicios con API Gateway

El módulo `wise_auth` es parte de una **arquitectura de microservicios** donde cada servicio es responsable de un dominio específico del negocio.

```
                                    ┌─────────────────────┐
                                    │                     │
                                    │   Usuarios Finales  │
                                    │  (Web/Mobile Apps)  │
                                    │                     │
                                    └──────────┬──────────┘
                                               │
                                               │ HTTPS
                                               ▼
                      ┌────────────────────────────────────────────┐
                      │          API GATEWAY (Port 3002)           │
                      │  - Routing                                 │
                      │  - Rate Limiting                           │
                      │  - CORS                                    │
                      │  - Request/Response Transformation         │
                      └──────┬─────────────────┬───────────────┬───┘
                             │                 │               │
                  ┌──────────▼──────┐  ┌──────▼─────┐  ┌──────▼──────┐
                  │                 │  │            │  │             │
                  │   WISE_AUTH     │  │ WISE_TUT   │  │ WISE_MAT    │
                  │   (Port 3001)   │  │ (Port 3003)│  │ (Port 3004) │
                  │                 │  │            │  │             │
                  │ - Autenticación │  │ - Tutorías │  │ - Materiales│
                  │ - Gestión Users │  │ - Sesiones │  │ - Recursos  │
                  │                 │  │            │  │             │
                  └────────┬────────┘  └──────┬─────┘  └──────┬──────┘
                           │                  │                │
                           │    ┌─────────────▼────────────────┤
                           │    │                               │
                           └────▼─────────────┐                 │
                                │             │                 │
                         ┌──────▼──────┐  ┌───▼────────┐  ┌────▼───────┐
                         │             │  │            │  │            │
                         │ PostgreSQL  │  │ Azure      │  │ SendGrid   │
                         │ (Supabase)  │  │ Service    │  │ (Email)    │
                         │             │  │ Bus        │  │            │
                         └─────────────┘  └────────────┘  └────────────┘
```

### 6.2 Arquitectura Interna de wise_auth (Layered Architecture)

Internamente, el microservicio usa **arquitectura en capas** (Layered Architecture):

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  (Controllers, Guards, Decorators, DTOs)                   │
│                                                            │
│  - AuthController: Expone endpoints HTTP                   │
│  - Guards: JwtAuthGuard, RolesGuard, GoogleAuthGuard       │
│  - DTOs: GoogleUserDto, AuthResponseDto                    │
│  - Decorators: @Public, @Roles, @GetUser                   │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           │ Dependency Injection
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                    │
│  (Services, Strategies)                                    │
│                                                            │
│  - AuthService: Validación OAuth, generación JWT           │
│  - GoogleStrategy: Lógica OAuth con Google                 │
│  - JwtStrategy: Lógica validación JWT                      │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           │ Dependency Injection
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                       │
│  (Prisma, Database Models)                                 │
│                                                            │
│  - PrismaService: Client de Prisma ORM                     │
│  - Schema: Usuario, Rol, EstadoUsuario models              │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           │ TCP Connection
                           ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  │   (Supabase)    │
                  └─────────────────┘
```

**Características de Cada Capa**:

**Presentation Layer**:
- **Responsabilidad**: Interactuar con clientes HTTP
- **No debe**: Contener lógica de negocio
- **Depende de**: Business Logic Layer
- **Ejemplos**: AuthController, DTOs, Guards

**Business Logic Layer**:
- **Responsabilidad**: Implementar reglas de negocio
- **No debe**: Saber sobre HTTP o estructura de BD
- **Depende de**: Data Access Layer
- **Ejemplos**: AuthService, Strategies

**Data Access Layer**:
- **Responsabilidad**: Persistir y recuperar datos
- **No debe**: Contener lógica de negocio
- **Depende de**: Base de datos
- **Ejemplos**: PrismaService, Prisma Schema

**Ventajas de Layered Architecture**:

1. **Separation of Concerns**: Cada capa tiene responsabilidades claras
2. **Testabilidad**: Podemos testear cada capa independientemente con mocks
3. **Mantenibilidad**: Cambios en una capa no afectan otras
4. **Reusabilidad**: La lógica de negocio es reutilizable desde diferentes capas de presentación

### 6.3 Flujo de Datos Completo (Secuencia de Autenticación)

```
┌──────┐                                                      ┌──────────┐
│Client│                                                      │ Google   │
└──┬───┘                                                      └────┬─────┘
   │                                                               │
   │ 1. GET /auth/google                                          │
   ├──────────────────────────────────────┐                      │
   │                                       │                      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │      AuthController        │       │
   │                         │   @UseGuards(GoogleAuthG)  │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 2. GoogleAuthGuard   │
   │                                       │    redirects to      │
   │                                       ├──────────────────────►
   │                                       │                      │
   │                                       │                      │
   │ 3. User authorizes app                │                      │
   │◄──────────────────────────────────────┼──────────────────────┤
   │                                       │                      │
   │ 4. GET /auth/google/callback?code=X   │                      │
   ├───────────────────────────────────────►                      │
   │                                       │                      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │   GoogleAuthGuard          │       │
   │                         │   (intercepts request)     │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 5. Exchange code     │
   │                                       │    for token         │
   │                                       ├──────────────────────►
   │                                       │                      │
   │                                       │ 6. Get user profile  │
   │                                       │◄─────────────────────┤
   │                                       │                      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │    GoogleStrategy          │       │
   │                         │    validate(profile)       │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 7. Transform to DTO  │
   │                                       │    (GoogleUserDto)   │
   │                                       │                      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │   AuthController           │       │
   │                         │   googleAuthCallback()     │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 8. Call service      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │    AuthService             │       │
   │                         │ validateGoogleUser(dto)    │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 9. Find/Create user  │
   │                         ┌─────────────▼──────────────┐       │
   │                         │     PrismaService          │       │
   │                         │   usuario.upsert()         │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 10. DB Query         │
   │                         ┌─────────────▼──────────────┐       │
   │                         │       PostgreSQL           │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 11. User record      │
   │                         ┌─────────────▼──────────────┐       │
   │                         │    AuthService             │       │
   │                         │  generateJwtToken()        │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 12. Send event       │
   │                         ┌─────────────▼──────────────┐       │
   │                         │   Azure Service Bus        │       │
   │                         │  (new user notification)   │       │
   │                         └─────────────┬──────────────┘       │
   │                                       │                      │
   │                                       │ 13. Return JWT       │
   │ 14. Redirect to frontend with token   │                      │
   │◄───────────────────────────────────────┤                      │
   │   /auth/callback?token=JWT&user=...   │                      │
   │                                       │                      │
```

### 6.4 Justificación de Decisiones Arquitectónicas

#### 6.4.1 ¿Por qué Microservicios?

**Ventajas para ECIWISE**:

1. **Escalabilidad Independiente**: Si el módulo de autenticación recibe 10x más tráfico que otros (todos se autentican, pero no todos usan tutorías), podemos escalar solo wise_auth.

2. **Despliegue Independiente**: Podemos actualizar wise_auth sin tocar wise_tutorías. Esto reduce el riesgo de romper funcionalidad no relacionada.

3. **Tecnologías Especializadas**: Si en el futuro un módulo necesita Python (ML) y otro Go (performance), pueden coexistir. Actualmente todos usan NestJS, pero tenemos flexibilidad.

4. **Equipos Autónomos**: Diferentes equipos pueden trabajar en diferentes microservicios sin bloquearse mutuamente. Menos merge conflicts, más velocidad.

5. **Fallas Aisladas**: Si wise_materiales cae, wise_auth y wise_tutorías siguen funcionando. Resiliencia mediante aislamiento.

**Desventajas (que aceptamos)**:

1. **Complejidad Operativa**: Más servicios = más despliegues, más monitoreo, más logs distribuidos. Mitigado con herramientas como Kubernetes, ELK stack.

2. **Latencia de Red**: Llamadas entre microservicios son más lentas que llamadas en memoria. Mitigado con caché y diseño asíncrono.

3. **Transacciones Distribuidas**: Difícil mantener ACID a través de servicios. Usamos eventual consistency y sagas cuando es necesario.

#### 6.4.2 ¿Por qué Layered Architecture Internamente?

**Razones**:

1. **Claridad**: Los desarrolladores entienden inmediatamente dónde poner cada tipo de código. Lógica de BD va en PrismaService, lógica de negocio en AuthService, rutas HTTP en AuthController.

2. **Testabilidad**: Podemos testear AuthService sin levantar un servidor HTTP. Podemos testear PrismaService sin conectar a BD (usando mocks).

3. **Evolución**: Si mañana queremos agregar GraphQL además de REST, creamos un nuevo controlador GraphQL que reutiliza el mismo AuthService.

4. **Refactoring Seguro**: Podemos cambiar la implementación de una capa sin afectar otras. Por ejemplo, migrar de Prisma a TypeORM solo afecta Data Access Layer.

#### 6.4.3 ¿Por qué OAuth 2.0 en lugar de Credenciales Locales?

**Decisión**: Usar Google OAuth como único método de autenticación.

**Razones**:

1. **Seguridad**: No almacenamos passwords. No hay riesgo de leak de credenciales, no necesitamos lógica de reset de password, no necesitamos enforcar políticas de complejidad.

2. **UX**: Los usuarios ya están logueados en Google (email institucional). Login con un click vs formularios de registro.

3. **Mantenimiento**: Google maneja 2FA, detección de login sospechoso, recovery de cuentas. Nosotros no tenemos que implementar esto.

4. **Confianza**: Los usuarios confían en Google más que en una plataforma nueva. Ven "Login con Google" y saben qué esperar.

**Desventaja**: Dependencia de Google. Si Google tiene downtime, nuestro login falla. Mitigado con SLA de Google (99.9%+ uptime).

#### 6.4.4 ¿Por qué JWT en lugar de Sesiones?

**Decisión**: Tokens JWT stateless en lugar de sesiones en servidor.

**Comparación**:

| Aspecto | JWT (Nuestra Elección) | Sesiones en Servidor |
|---------|------------------------|----------------------|
| **Storage** | Cliente (localStorage/cookie) | Servidor (Redis/BD) |
| **Escalabilidad** | ✅ Sin estado compartido | ❌ Requiere session store compartido |
| **Performance** | ✅ No consulta BD por request | ❌ Consulta Redis/BD por request |
| **Revocación** | ❌ Difícil revocar antes de expiración | ✅ Fácil (borrar de Redis) |
| **Tamaño** | ❌ ~200-500 bytes por request | ✅ ~20 bytes (session ID) |
| **Stateless** | ✅ Microservicios no comparten estado | ❌ Necesitan acceso a session store |

**Por qué elegimos JWT**:

1. **Microservicios**: Cada instancia de wise_auth puede validar tokens independientemente sin consultar una BD de sesiones compartida.

2. **Carga**: Con 10,000 usuarios concurrentes, JWT evita 10,000 queries a Redis por segundo. El CPU para validar JWT es más barato.

3. **Movilidad**: El token se puede usar desde web, mobile, o desktop sin cambios. Las sesiones son más complicadas en mobile.

**Mitigación de Revocación**: Si necesitamos revocar un token antes de expiración (usuario suspendido), el JwtStrategy valida el estado del usuario en BD. El token es válido criptográficamente, pero el usuario está inactivo.

## 7. FUNCIONALIDADES DEL MÓDULO CON INFORMACIÓN DETALLADA DE REQUEST/RESPONSE

### 7.1 Endpoint: Iniciar Autenticación con Google

**Ruta**: `GET /auth/google`

**Descripción**: Inicia el flujo de autenticación OAuth 2.0 con Google. Redirige al usuario a la página de login de Google donde puede autorizar la aplicación.

**Tipo**: Endpoint público (no requiere autenticación previa)

**Decoradores Aplicados**:
```typescript
@Get('google')
@Public()
@UseGuards(GoogleAuthGuard)
@ApiOperation({ summary: 'Iniciar autenticación con Google OAuth 2.0' })
```

#### Request

**Método HTTP**: `GET`

**Headers**: Ninguno requerido

**Query Parameters**: Ninguno

**Body**: N/A (método GET)

**Ejemplo de Request**:
```http
GET /auth/google HTTP/1.1
Host: api.eciwise.com
```

#### Response

**Status Code**: `302 Found` (Redirección)

**Headers**:
```http
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://api.eciwise.com/auth/google/callback&
  response_type=code&
  scope=email+profile&
  state=RANDOM_STATE_TOKEN
```

**Body**: Vacío (la redirección es automática)

**Tipos de Datos**:
- **Location** (string, URL): URL de redirección a Google OAuth

#### Flujo Detallado

1. Cliente hace GET a `/auth/google`
2. `GoogleAuthGuard` intercepta la request
3. Guard activa `GoogleStrategy`
4. Strategy construye URL de Google OAuth con:
   - `client_id`: ID de la aplicación registrada en Google Cloud
   - `redirect_uri`: URL de callback configurada
   - `scope`: Permisos solicitados (email, profile)
   - `state`: Token CSRF para prevenir ataques
5. Strategy responde con `302 Found` redirigiendo a Google
6. Navegador del usuario automáticamente sigue la redirección

#### Escenarios de Error

| Escenario | Status Code | Mensaje | Razón |
|-----------|-------------|---------|-------|
| Google OAuth mal configurado | 500 | "Error de configuración OAuth" | CLIENT_ID o CLIENT_SECRET inválidos |
| Callback URL no autorizada | 500 | "Redirect URI mismatch" | URL no registrada en Google Cloud Console |

---

### 7.2 Endpoint: Callback de Google OAuth

**Ruta**: `GET /auth/google/callback`

**Descripción**: Endpoint al que Google redirige después de que el usuario autoriza la aplicación. Procesa el código de autorización, valida el usuario, crea o actualiza su cuenta, genera un JWT, y redirige al frontend con el token.

**Tipo**: Endpoint público pero protegido por `GoogleAuthGuard`

**Decoradores Aplicados**:
```typescript
@Get('google/callback')
@Public()
@UseGuards(GoogleAuthGuard)
@ApiOperation({ 
  summary: 'Callback de Google OAuth',
  description: 'Valida el usuario, crea o actualiza cuenta, y retorna token JWT'
})
```

#### Request

**Método HTTP**: `GET`

**Headers**: Ninguno requerido

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `code` | string | Sí | Código de autorización de Google | `4/0AY0e-g7X...` |
| `state` | string | Sí | Token CSRF para validación | `random_token_123` |
| `scope` | string | Sí | Scopes autorizados por el usuario | `email profile` |

**Ejemplo de Request**:
```http
GET /auth/google/callback?code=4/0AY0e-g7XYZ&state=abc123&scope=email+profile HTTP/1.1
Host: api.eciwise.com
```

#### Response

**Status Code**: `307 Temporary Redirect`

**Headers**:
```http
Location: http://frontend.eciwise.com/auth/callback?
  token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&
  user=%7B%22id%22%3A%22550e8400...%22%2C%22email%22%3A%22user%40university.edu%22%7D
```

**Body**: Vacío (redirección)

**Query Parameters en Redirección**:

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `token` | string (JWT) | Token de acceso para autenticación | `eyJhbGciOiJ...` |
| `user` | string (JSON URL-encoded) | Información del usuario | `%7B%22id%22%3A...` |

**Estructura del Parámetro `user` (decodificado)**:

```typescript
{
  id: string,          // UUID del usuario
  email: string,       // Email del usuario
  nombre: string,      // Nombre
  apellido: string,    // Apellido
  rol: string,         // 'estudiante', 'tutor', o 'admin'
  avatarUrl?: string   // URL de foto de perfil (opcional)
}
```

**Tipo Completo**:
```typescript
interface CallbackRedirectParams {
  token: string;  // Tipo: JWT string (Base64)
  user: string;   // Tipo: JSON string URL-encoded
}

interface UserData {
  id: string;           // Tipo primitivo: string (UUID)
  email: string;        // Tipo primitivo: string
  nombre: string;       // Tipo primitivo: string
  apellido: string;     // Tipo primitivo: string
  rol: string;          // Tipo enum: Role ('estudiante' | 'tutor' | 'admin')
  avatarUrl?: string;   // Tipo primitivo opcional: string | undefined
}
```

**Restricciones de Campos**:

| Campo | Restricción | Validación |
|-------|-------------|------------|
| `id` | UUID v4 válido | Formato: `550e8400-e29b-41d4-a716-446655440000` |
| `email` | Email válido | Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `nombre` | No vacío, max 100 chars | Length: 1-100 |
| `apellido` | No vacío, max 100 chars | Length: 1-100 |
| `rol` | Enum: estudiante, tutor, admin | Valores fijos |
| `avatarUrl` | URL válida o null | Formato: `https://...` |

#### Flujo Detallado

1. Google redirige a `/auth/google/callback?code=X`
2. `GoogleAuthGuard` intercepta
3. Guard llama a `GoogleStrategy`
4. Strategy intercambia el `code` por un `access_token` (llamada a Google)
5. Strategy obtiene perfil del usuario con el `access_token`
6. Strategy transforma perfil a `GoogleUserDto`
7. Strategy retorna el DTO, que se adjunta a `request.user`
8. Controller recibe la request con `request.user` poblado
9. Controller llama a `AuthService.validateGoogleUser(googleUserDto)`
10. Service busca usuario por `google_id` en BD
11. Si existe: actualiza `ultimo_login` y `avatar_url`
12. Si no existe: crea nuevo usuario con rol "estudiante"
13. Service genera JWT con payload: `{ sub: userId, email, rol }`
14. Si es nuevo usuario: envía evento a Azure Service Bus
15. Service retorna `AuthResponseDto` con token y datos de usuario
16. Controller construye URL de redirección al frontend
17. Controller responde con `307 Temporary Redirect`
18. Navegador redirige al frontend con token en query params

#### Escenarios de Error

| Escenario | Status Code | Mensaje | Headers de Redirección |
|-----------|-------------|---------|------------------------|
| Código de autorización inválido | 307 | N/A | `Location: /auth/callback?error=C%C3%B3digo+inv%C3%A1lido` |
| No se pudo obtener email de Google | 307 | N/A | `Location: /auth/callback?error=Email+no+disponible` |
| Error de base de datos | 307 | N/A | `Location: /auth/callback?error=Error+interno` |
| Error al generar JWT | 307 | N/A | `Location: /auth/callback?error=Error+generando+token` |

**Nota**: Los errores se manejan redirigiendo al frontend con un parámetro `?error=` en lugar de retornar JSON, porque el flujo OAuth debe mantener al usuario en el navegador.

---

### 7.3 Endpoint: Obtener Perfil del Usuario Autenticado

**Ruta**: `GET /auth/profile`

**Descripción**: Retorna la información completa del perfil del usuario que realizó la request. Requiere autenticación JWT válida.

**Tipo**: Endpoint protegido (requiere JWT)

**Decoradores Aplicados**:
```typescript
@Get('profile')
@Roles(Role.ESTUDIANTE, Role.TUTOR, Role.ADMIN)  // Todos los roles autenticados
@ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
@ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente', type: Usuario })
@ApiResponse({ status: 401, description: 'Token JWT inválido o expirado' })
@ApiResponse({ status: 403, description: 'Usuario inactivo o suspendido' })
@ApiBearerAuth('JWT-auth')
```

#### Request

**Método HTTP**: `GET`

**Headers**:

| Header | Tipo | Requerido | Descripción | Ejemplo |
|--------|------|-----------|-------------|---------|
| `Authorization` | string | Sí | Token JWT en formato Bearer | `Bearer eyJhbGciOi...` |

**Query Parameters**: Ninguno

**Body**: N/A

**Ejemplo de Request**:
```http
GET /auth/profile HTTP/1.1
Host: api.eciwise.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAdW5pdmVyc2l0eS5lZHUiLCJyb2wiOiJlc3R1ZGlhbnRlIiwiaWF0IjoxNzAxMDAwMDAwLCJleHAiOjE3MDE2MDQ4MDB9.signature
```

**Validaciones del Token**:
1. Formato: Debe empezar con "Bearer "
2. Estructura: Tres segmentos separados por puntos (header.payload.signature)
3. Firma: Debe ser válida con el `JWT_SECRET`
4. Expiración: `exp` claim debe ser mayor a timestamp actual
5. Usuario: `sub` (userId) debe existir en BD
6. Estado: Usuario debe estar "activo"

#### Response Success

**Status Code**: `200 OK`

**Headers**:
```http
Content-Type: application/json
```

**Body**:

```typescript
interface UsuarioResponse {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  biografia: string | null;
  semestre: number;
  google_id: string | null;
  avatar_url: string | null;
  rol_id: number;
  estado_id: number;
  ultimo_login: string | null;  // ISO 8601 timestamp
  disponibilidad: object | null;
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  rol: {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
  };
  estado: {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
  };
}
```

**Ejemplo de Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "juan.perez@university.edu",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+57 300 1234567",
  "biografia": "Estudiante de ingeniería de sistemas, apasionado por el desarrollo web",
  "semestre": 5,
  "google_id": "1234567890",
  "avatar_url": "https://lh3.googleusercontent.com/a/default-user=s96-c",
  "rol_id": 1,
  "estado_id": 1,
  "ultimo_login": "2024-12-02T14:30:00.000Z",
  "disponibilidad": null,
  "created_at": "2024-01-15T08:00:00.000Z",
  "updated_at": "2024-12-02T14:30:00.000Z",
  "rol": {
    "id": 1,
    "nombre": "estudiante",
    "descripcion": "Usuario estudiante con permisos básicos",
    "activo": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "estado": {
    "id": 1,
    "nombre": "activo",
    "descripcion": "Usuario activo y con acceso completo",
    "activo": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Tipos Detallados de Campos**:

| Campo | Tipo Primitivo/Complejo | Nullable | Restricciones |
|-------|-------------------------|----------|---------------|
| `id` | string (UUID) | No | Formato UUID v4 |
| `email` | string | No | Email válido, único en BD |
| `nombre` | string | No | Length: 1-100 |
| `apellido` | string | No | Length: 1-100 |
| `telefono` | string | Sí | Formato: `+XX XXX XXXXXXX` |
| `biografia` | string | Sí | Max length: 500 |
| `semestre` | number (integer) | No | Range: 1-10 |
| `google_id` | string | Sí | ID de Google OAuth, único |
| `avatar_url` | string (URL) | Sí | URL válida HTTPS |
| `rol_id` | number (integer) | No | Foreign key a `roles.id` |
| `estado_id` | number (integer) | No | Foreign key a `estados_usuario.id` |
| `ultimo_login` | string (ISO 8601) | Sí | Timestamp con zona horaria |
| `disponibilidad` | object (JSON) | Sí | Estructura específica de horarios |
| `created_at` | string (ISO 8601) | No | Timestamp automático |
| `updated_at` | string (ISO 8601) | No | Timestamp auto-actualizado |
| `rol` | object (Rol) | No | Objeto anidado con datos del rol |
| `estado` | object (EstadoUsuario) | No | Objeto anidado con datos del estado |

**Estructura de `disponibilidad` (cuando presente)**:
```typescript
interface Disponibilidad {
  [dia: string]: SlotHorario[];  // Días: monday, tuesday, wednesday, etc.
}

interface SlotHorario {
  start: string;      // Formato: "HH:MM" (24h)
  end: string;        // Formato: "HH:MM" (24h)
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
}
```

**Ejemplo de `disponibilidad`**:
```json
{
  "monday": [
    { "start": "09:00", "end": "11:00", "modalidad": "VIRTUAL" },
    { "start": "14:00", "end": "16:00", "modalidad": "PRESENCIAL" }
  ],
  "tuesday": [],
  "wednesday": [
    { "start": "10:00", "end": "12:00", "modalidad": "VIRTUAL" }
  ]
}
```

#### Escenarios de Error

**Error 401: Token Inválido o Expirado**

**Response**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Causas Posibles**:
- Token mal formado (no tiene 3 partes)
- Firma inválida (token modificado)
- Token expirado (`exp` claim < now)
- Header Authorization faltante
- Formato incorrecto (falta "Bearer ")

**Error 403: Usuario Inactivo o Suspendido**

**Response**:
```json
{
  "statusCode": 403,
  "message": "Usuario inactivo o suspendido",
  "error": "Forbidden"
}
```

**Causas Posibles**:
- `estado_id = 2` (inactivo)
- `estado_id = 3` (suspendido)
- Usuario eliminado de BD pero token aún válido

**Error 404: Usuario No Encontrado**

**Response**:
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado",
  "error": "Not Found"
}
```

**Causas Posibles**:
- Usuario eliminado de BD después de generar el token
- `sub` claim del JWT no corresponde a ningún usuario

---

### 7.4 Endpoint: Health Check

**Ruta**: `GET /auth/health`

**Descripción**: Verifica que el servicio de autenticación está operativo y puede conectarse a sus dependencias (base de datos, service bus). Útil para health checks de Kubernetes o monitoreo.

**Tipo**: Endpoint público

**Decoradores Aplicados**:
```typescript
@Get('health')
@Public()
@ApiOperation({ summary: 'Verificar estado del servicio' })
@ApiResponse({ status: 200, description: 'Servicio operativo' })
@ApiResponse({ status: 503, description: 'Servicio no disponible' })
```

#### Request

**Método HTTP**: `GET`

**Headers**: Ninguno requerido

**Query Parameters**: Ninguno

**Body**: N/A

**Ejemplo de Request**:
```http
GET /auth/health HTTP/1.1
Host: api.eciwise.com
```

#### Response Success

**Status Code**: `200 OK`

**Body**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T14:35:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "service_bus": "connected"
}
```

**Tipos de Campos**:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | Estado general: 'ok' o 'error' |
| `timestamp` | string (ISO 8601) | Timestamp de la verificación |
| `uptime` | number (segundos) | Tiempo que el servicio ha estado corriendo |
| `database` | string | Estado de la conexión a PostgreSQL: 'connected' o 'disconnected' |
| `service_bus` | string | Estado del Service Bus: 'connected' o 'disconnected' |

#### Response Error

**Status Code**: `503 Service Unavailable`

**Body**:
```json
{
  "status": "error",
  "timestamp": "2024-12-02T14:35:00.000Z",
  "uptime": 3600,
  "database": "disconnected",
  "service_bus": "connected",
  "error": "Cannot connect to database"
}
```

**Escenarios**:
- Base de datos no responde
- Service Bus no disponible
- Servicio en proceso de despliegue

---

## 8. MANEJO DE ERRORES Y CÓDIGOS DE RESPUESTA

### 8.1 Filosofía de Manejo de Errores

El módulo `wise_auth` implementa una estrategia de manejo de errores **centralizada y consistente** basada en los siguientes principios:

1. **HTTP Status Codes Semánticos**: Cada tipo de error retorna el código HTTP apropiado según la especificación RFC 7231.

2. **Mensajes Descriptivos**: Los mensajes de error son claros y orientados al desarrollador, facilitando el debugging.

3. **No Exposición de Detalles Internos**: Los mensajes de error no revelan información sensible (estructura de BD, stack traces en producción).

4. **Formato Consistente**: Todos los errores siguen la misma estructura JSON, facilitando el parsing por clientes.

5. **Logging Centralizado**: Todos los errores se logguean con contexto suficiente para troubleshooting.

### 8.2 Estructura Estándar de Respuesta de Error

```typescript
interface ErrorResponse {
  statusCode: number;     // Código HTTP
  message: string;        // Mensaje legible para humanos
  error: string;          // Nombre del error (Unauthorized, Forbidden, etc.)
  timestamp?: string;     // ISO 8601 timestamp
  path?: string;          // Ruta que generó el error
}
```

**Ejemplo**:
```json
{
  "statusCode": 401,
  "message": "Token JWT inválido o expirado",
  "error": "Unauthorized",
  "timestamp": "2024-12-02T14:40:00.000Z",
  "path": "/auth/profile"
}
```

### 8.3 Tabla Completa de Códigos de Error

#### 8.3.1 Errores de Cliente (4xx)

| Código | Error | Escenario | Mensaje | Solución |
|--------|-------|-----------|---------|----------|
| **400** | Bad Request | Datos de entrada inválidos | "Validation failed: email must be an email" | Verificar que el DTO cumpla las validaciones |
| **400** | Bad Request | Formato de JSON inválido | "Unexpected token in JSON at position 0" | Enviar JSON válido |
| **401** | Unauthorized | Token JWT faltante | "Unauthorized" | Incluir header Authorization: Bearer {token} |
| **401** | Unauthorized | Token JWT mal formado | "jwt malformed" | Verificar formato del token (3 partes) |
| **401** | Unauthorized | Token JWT expirado | "jwt expired" | Hacer login nuevamente para obtener nuevo token |
| **401** | Unauthorized | Firma JWT inválida | "invalid signature" | Token modificado o secreto incorrecto |
| **401** | Unauthorized | Usuario no encontrado | "Usuario no encontrado" | El usuario del token fue eliminado |
| **401** | Unauthorized | Email no obtenido de Google | "No se pudo obtener el email de Google" | Usuario no autorizó scope de email en Google |
| **403** | Forbidden | Usuario sin rol requerido | "Se requiere uno de los siguientes roles: admin" | El usuario no tiene permisos para esta ruta |
| **403** | Forbidden | Usuario no autenticado (en RolesGuard) | "Usuario no autenticado" | Token válido pero usuario no en request.user |
| **403** | Forbidden | Usuario inactivo | "Usuario inactivo o suspendido" | Contactar administrador para reactivar cuenta |
| **403** | Forbidden | Usuario suspendido | "Usuario suspendido por violación de políticas" | Revisar políticas y apelar suspensión |
| **404** | Not Found | Ruta inexistente | "Cannot GET /auth/unknown" | Verificar la ruta en la documentación |
| **404** | Not Found | Usuario no existe | "Usuario no encontrado" | El userId no existe en la base de datos |

#### 8.3.2 Errores de Servidor (5xx)

| Código | Error | Escenario | Mensaje | Acción |
|--------|-------|-----------|---------|--------|
| **500** | Internal Server Error | Error no manejado | "Internal server error" | Revisar logs del servidor |
| **500** | Internal Server Error | Error en base de datos | "Error al conectar con la base de datos" | Verificar conexión a PostgreSQL |
| **500** | Internal Server Error | Error al generar JWT | "Error generando token de autenticación" | Verificar JWT_SECRET en variables de entorno |
| **500** | Internal Server Error | Error en Google OAuth | "Error de configuración OAuth" | Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET |
| **500** | Internal Server Error | Error en Service Bus | "Error al enviar notificación" | Verificar conexión a Azure Service Bus |
| **503** | Service Unavailable | Base de datos no disponible | "Servicio de base de datos no disponible" | Esperar a que PostgreSQL vuelva a estar disponible |
| **503** | Service Unavailable | Servicio en mantenimiento | "Servicio en mantenimiento programado" | Esperar a que termine el mantenimiento |

### 8.4 Manejo de Errores por Capa

#### 8.4.1 Capa de Validación (DTOs)

**Responsable**: `ValidationPipe` de NestJS

**Errores Generados**: `400 Bad Request`

**Ejemplo de Error de Validación**:

Request con email inválido:
```json
{
  "email": "not-an-email",
  "nombre": "Juan"
}
```

Response:
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "apellido should not be empty"
  ],
  "error": "Bad Request"
}
```

**Validaciones Aplicadas por Campo**:

**GoogleUserDto**:
- `googleId`: @IsString, @IsNotEmpty → "googleId must be a string", "googleId should not be empty"
- `email`: @IsEmail, @IsNotEmpty → "email must be an email", "email should not be empty"
- `nombre`: @IsString, @IsNotEmpty → "nombre must be a string", "nombre should not be empty"
- `apellido`: @IsString, @IsNotEmpty → "apellido must be a string", "apellido should not be empty"
- `avatarUrl`: @IsString, @IsOptional → "avatarUrl must be a string"

#### 8.4.2 Capa de Autenticación (Guards)

**Responsable**: `JwtAuthGuard`, `GoogleAuthGuard`

**Errores Generados**: `401 Unauthorized`

**Escenarios Detallados**:

1. **Token Faltante**:
   ```json
   {
     "statusCode": 401,
     "message": "Unauthorized",
     "error": "Unauthorized"
   }
   ```

2. **Token Expirado**:
   ```json
   {
     "statusCode": 401,
     "message": "jwt expired",
     "error": "Unauthorized"
   }
   ```
   **Causa**: El claim `exp` del JWT es menor que el timestamp actual.
   **Solución**: Hacer login nuevamente. El token tiene TTL de 7 días por defecto.

3. **Token Modificado**:
   ```json
   {
     "statusCode": 401,
     "message": "invalid signature",
     "error": "Unauthorized"
   }
   ```
   **Causa**: El payload o header del JWT fue alterado. La firma ya no coincide.
   **Solución**: No modificar el token. Si fue interceptado, regenerarlo.

#### 8.4.3 Capa de Autorización (RolesGuard)

**Responsable**: `RolesGuard`

**Errores Generados**: `403 Forbidden`

**Escenarios Detallados**:

1. **Sin Rol Requerido**:
   
   Endpoint requiere admin, usuario es estudiante:
   ```json
   {
     "statusCode": 403,
     "message": "Se requiere uno de los siguientes roles: admin",
     "error": "Forbidden"
   }
   ```

2. **Usuario Inactivo**:
   
   Usuario autenticado pero con `estado_id = 2`:
   ```json
   {
     "statusCode": 403,
     "message": "Usuario inactivo o suspendido",
     "error": "Forbidden"
   }
   ```

3. **Usuario No Autenticado (en RolesGuard)**:
   
   JWT válido pero request.user es null (error interno):
   ```json
   {
     "statusCode": 403,
     "message": "Usuario no autenticado",
     "error": "Forbidden"
   }
   ```

#### 8.4.4 Capa de Negocio (Services)

**Responsable**: `AuthService`

**Errores Generados**: `500 Internal Server Error`, `401 Unauthorized`

**Escenarios**:

1. **Error al Crear Usuario**:
   
   Falla en `prisma.usuario.create()`:
   ```json
   {
     "statusCode": 500,
     "message": "Error al crear usuario en la base de datos",
     "error": "Internal Server Error"
   }
   ```
   **Log (servidor)**:
   ```
   [AuthService] ERROR: Error al crear usuario desde Google: user@example.com
   Error: P2002: Unique constraint failed on the fields: (`email`)
   ```

2. **Error al Generar JWT**:
   
   Falla en `jwtService.sign()`:
   ```json
   {
     "statusCode": 500,
     "message": "Error generando token de autenticación",
     "error": "Internal Server Error"
   }
   ```

3. **Email No Obtenido de Google**:
   
   Google no retorna email en el perfil:
   ```json
   {
     "statusCode": 401,
     "message": "No se pudo obtener el email de Google",
     "error": "Unauthorized"
   }
   ```

#### 8.4.5 Capa de Datos (Prisma)

**Responsable**: `PrismaService`

**Errores Generados**: `500 Internal Server Error`

**Códigos de Error de Prisma**:

| Código Prisma | Significado | Mensaje al Usuario | Acción |
|---------------|-------------|--------------------| -------|
| `P2002` | Unique constraint violation | "El email ya está registrado" | Usar otro email o hacer login |
| `P2025` | Record not found | "Usuario no encontrado" | Verificar que el ID existe |
| `P1001` | Can't reach database | "Error al conectar con la base de datos" | Verificar conexión de red |
| `P1017` | Server closed connection | "Conexión a base de datos interrumpida" | Reintentar operación |

**Ejemplo de Manejo**:

```typescript
try {
  const user = await this.prisma.usuario.create({ data: userData });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint
    throw new ConflictException('El email ya está registrado');
  }
  // Otros errores
  throw new InternalServerErrorException('Error al crear usuario');
}
```

### 8.5 Logging de Errores

Todos los errores se registran con el Logger de NestJS:

**Formato de Log**:
```
[TIMESTAMP] [LEVEL] [CONTEXT] MESSAGE
```

**Ejemplo de Logs**:

```
[2024-12-02 14:45:00] [ERROR] [AuthService] Error al validar usuario de Google: user@example.com
  Error: Cannot connect to database
  at PrismaService.connect (prisma.service.ts:25)
  ...stack trace...

[2024-12-02 14:46:00] [WARN] [JwtAuthGuard] Token expirado para usuario: 550e8400-e29b-41d4-a716-446655440000

[2024-12-02 14:47:00] [ERROR] [AuthService] Error al enviar notificación a Service Bus
  Error: ECONNREFUSED
  at ServiceBusClient.send (azure-service-bus.ts:100)
  ...stack trace...
```

**Niveles de Log**:
- **ERROR**: Errores que impiden completar una operación
- **WARN**: Situaciones anormales pero manejables (token expirado, usuario inactivo)
- **LOG**: Operaciones normales importantes (nuevo usuario, login exitoso)
- **DEBUG**: Información detallada para debugging (queries SQL, responses de Google)

### 8.6 Estrategias de Recuperación de Errores

#### 8.6.1 Retry con Backoff Exponencial

Para operaciones que pueden fallar temporalmente (Service Bus), usamos retry:

```typescript
async sendNotificacionNuevoUsuario(email: string, nombre: string, userId: string) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 segundo

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Intentar enviar mensaje
      await this.serviceBusClient.send(message);
      return; // Éxito
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Último intento falló, logguear y continuar
        this.logger.error(`No se pudo enviar notificación después de ${maxRetries} intentos`);
        return;
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### 8.6.2 Circuit Breaker

Si la base de datos está caída, no intentamos queries que sabemos que fallarán:

```typescript
if (!this.prisma.isConnected()) {
  throw new ServiceUnavailableException('Base de datos no disponible');
}
```

#### 8.6.3 Graceful Degradation

Si Service Bus falla, la autenticación continúa (notificaciones son no-críticas):

```typescript
try {
  await this.sendNotificacionNuevoUsuario(...);
} catch (error) {
  // Logguear pero no fallar la autenticación
  this.logger.error('Error enviando notificación (non-blocking)', error);
}
```

### 8.7 Monitoreo y Alertas

**Métricas Monitoreadas**:

1. **Tasa de Errores**: Errores 5xx / Total requests > 1% → Alerta
2. **Latencia**: p95 de response time > 500ms → Warning
3. **Tasa de Autenticación**: Logins exitosos / intentos < 95% → Investigar
4. **Health Check**: `/auth/health` retorna 503 → Alerta crítica
5. **Tokens Expirados**: Rechazos por token expirado > baseline → Puede indicar ataque

**Herramientas**:
- **Prometheus**: Colecta métricas
- **Grafana**: Visualización de métricas
- **Azure Monitor**: Logs agregados
- **Sentry**: Error tracking y alertas

---

## 9. DIAGRAMAS ADICIONALES

### 9.1 Diagrama de Secuencia: Flujo Completo de Autenticación

```
Usuario    Frontend    Gateway    wise_auth    Google    PostgreSQL    ServiceBus
  │           │           │           │           │           │             │
  │  Clic     │           │           │           │           │             │
  │ "Login"   │           │           │           │           │             │
  ├─────────► │           │           │           │           │             │
  │           │           │           │           │           │             │
  │           │  GET /auth/google     │           │           │             │
  │           ├────────── ┼──────────►│           │           │             │
  │           │           │           │           │           │             │
  │           │           │    Redirige a Google OAuth        │             │
  │           │           │           ├──────────►│           │             │
  │           │           │           │           │           │             │
  │  Google Login Page    │           │           │           │             │
  │◄──────────┴───────────┴───────────┴───────────┤           │             │
  │                                               │           │             │
  │  Autoriza App                                 │           │             │
  ├──────────────────────────────────────────────►│           │             │
  │                                               │           │             │
  │           │  Redirect /auth/google/callback?code=X        │             │
  │◄──────────┴───────────┬───────────┬───────────┤           │             │
  │           │           │           │           │           │             │
  │           │           │     Intercambia code por token    │             │
  │           │           │           ├──────────►│           │             │
  │           │           │           │           │           │             │
  │           │           │     Obtiene perfil de usuario     │             │
  │           │           │           ├──────────►│           │             │
  │           │           │           │◄──────────┤           │             │
  │           │           │           │           │           │             │
  │           │           │    Busca usuario en BD            │             │
  │           │           │           ├──────────────────────►│             │
  │           │           │           │◄──────────────────────┤             │
  │           │           │           │     Usuario existe    │             │
  │           │           │           │           │           │             │
  │           │           │    Actualiza ultimo_login         │             │
  │           │           │           ├──────────────────────►│             │
  │           │           │           │◄──────────────────────┤             │
  │           │           │           │           │           │             │
  │           │           │    Genera JWT                     │             │
  │           │           │           │                       │             │
  │           │           │    Envía evento nuevo usuario     │             │
  │           │           │           ├─────────────────────────────────────►
  │           │           │           │           │           │     OK      │
  │           │           │           │◄─────────────────────────────────────┤
  │           │           │           │           │           │             │
  │           │  Redirige a /auth/callback?token=JWT&user=... │             │
  │◄──────────┴───────────┴───────────┤           │           │             │
  │           │           │           │           │           │             │
  │  Guarda token en localStorage     │           │           │             │
  │           │           │           │           │           │             │
```

### 9.2 Diagrama de Despliegue

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              App Service Plan (Linux)                      │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                │ │
│  │  │  Container 1     │  │  Container 2     │  ...           │ │
│  │  │  wise_auth       │  │  wise_auth       │                │ │
│  │  │  (Port 3001)     │  │  (Port 3001)     │                │ │
│  │  │  Node.js 18      │  │  Node.js 18      │                │ │
│  │  └──────────────────┘  └──────────────────┘                │ │
│  │           │                     │                           │ │
│  └───────────┼─────────────────────┼───────────────────────────┘ │
│              │                     │                             │
│              └─────────┬───────────┘                             │
│                        │                                         │
│              ┌─────────▼──────────┐                              │
│              │   Load Balancer    │                              │
│              │   (Azure LB)       │                              │
│              └─────────┬──────────┘                              │
│                        │                                         │
│  ┌─────────────────────┼───────────────────────────────────────┐ │
│  │                     ▼                                       ││
│  │        Azure Database for PostgreSQL                        ││
│  │        - 2 vCores, 8GB RAM                                  ││
│  │        - Automated backups (7 days)                         ││
│  │        - SSL enforced                                       ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │        Azure Service Bus (Standard Tier)                     ││
│  │        - Queues: mail.envio.individual,                      ││
│  │                  mail.envio.masivo,                          ││
│  │                  mail.envio.rol                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │        Azure Key Vault                                       ││
│  │        - JWT_SECRET                                          ││
│  │        - GOOGLE_CLIENT_SECRET                                ││
│  │        - DATABASE_PASSWORD                                   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
               ┌────────────────────┐
               │   Google OAuth     │
               │   (External)       │
               └────────────────────┘
```
 
