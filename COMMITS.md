# 📝 Convenciones de Commits y Mensajes

Este documento establece las convenciones y mejores prácticas para los mensajes de commit en el proyecto Wise Auth.

---

## 📋 Tabla de Contenidos

- [Conventional Commits](#conventional-commits)
- [Formato de Commits](#formato-de-commits)
- [Tipos de Commits](#tipos-de-commits)
- [Alcances (Scopes)](#alcances-scopes)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Reglas y Buenas Prácticas](#reglas-y-buenas-prácticas)
- [Commits Especiales](#commits-especiales)
- [Herramientas Recomendadas](#herramientas-recomendadas)

---

## 🎯 Conventional Commits

Este proyecto sigue la especificación [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) para mantener un historial de commits claro y automatizable.

### ¿Por qué usar Conventional Commits?

- ✅ **Historial legible**: Fácil de entender qué cambió y por qué
- ✅ **Changelog automático**: Generar notas de versión automáticamente
- ✅ **Versionado semántico**: Determinar automáticamente el tipo de versión
- ✅ **Mejor comunicación**: El equipo entiende rápidamente los cambios
- ✅ **CI/CD**: Integración con herramientas de automatización

---

## 📐 Formato de Commits

### Estructura Básica

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[nota al pie opcional]
```

### Estructura Detallada

```
<tipo>(<alcance>): <descripción corta en minúsculas>

<cuerpo opcional: explicación más detallada del cambio.
Usa el imperativo: "cambia" no "cambió" ni "cambiando".
Explica el QUÉ y el POR QUÉ, no el CÓMO.>

<nota al pie opcional: referencias a issues, breaking changes, etc.>
```

---

## 🏷️ Tipos de Commits

### Tipos Principales

| Tipo | Descripción | Bump Version |
|------|-------------|--------------|
| `feat` | Nueva funcionalidad | MINOR |
| `fix` | Corrección de bug | PATCH |
| `docs` | Cambios en documentación | - |
| `style` | Cambios de formato (no afectan lógica) | - |
| `refactor` | Refactorización sin cambiar funcionalidad | - |
| `perf` | Mejoras de rendimiento | PATCH |
| `test` | Añadir o modificar tests | - |
| `chore` | Tareas de mantenimiento | - |
| `build` | Cambios en sistema de build | - |
| `ci` | Cambios en CI/CD | - |
| `revert` | Revertir un commit anterior | - |

### Descripción Detallada de Tipos

#### `feat` - Nueva Funcionalidad
Nueva característica o funcionalidad para el usuario final.

**Ejemplos:**
```bash
feat(auth): agregar autenticación con Facebook
feat(jwt): implementar refresh tokens
feat(roles): añadir rol de supervisor
```

#### `fix` - Corrección de Bug
Solución a un problema o error en el código.

**Ejemplos:**
```bash
fix(jwt): corregir validación de tokens expirados
fix(auth): resolver error en callback de Google
fix(prisma): corregir consulta de usuarios duplicados
```

#### `docs` - Documentación
Cambios solo en documentación (README, comentarios, etc.).

**Ejemplos:**
```bash
docs(readme): actualizar instrucciones de instalación
docs(api): documentar endpoint de refresh token
docs(swagger): añadir ejemplos de respuesta
```

#### `style` - Formato
Cambios que no afectan la lógica (espacios, formato, punto y coma, etc.).

**Ejemplos:**
```bash
style(auth): formatear código con prettier
style: corregir indentación en controllers
style(dto): organizar imports alfabéticamente
```

#### `refactor` - Refactorización
Cambio de código que no corrige bugs ni añade funcionalidad.

**Ejemplos:**
```bash
refactor(auth): simplificar lógica de validación
refactor(guards): extraer lógica común a clase base
refactor: renombrar variables para mayor claridad
```

#### `perf` - Performance
Cambios que mejoran el rendimiento.

**Ejemplos:**
```bash
perf(db): optimizar consulta de usuarios
perf(auth): cachear tokens JWT
perf: reducir tamaño de bundle
```

#### `test` - Tests
Añadir tests faltantes o corregir tests existentes.

**Ejemplos:**
```bash
test(auth): agregar tests para Google OAuth
test(jwt): aumentar cobertura de guards
test: corregir tests e2e que fallaban
```

#### `chore` - Mantenimiento
Tareas de mantenimiento, actualización de dependencias, etc.

**Ejemplos:**
```bash
chore(deps): actualizar dependencias
chore: configurar husky para pre-commit
chore(package): actualizar versión a 1.1.0
```

#### `build` - Build
Cambios en el sistema de build o dependencias externas.

**Ejemplos:**
```bash
build(docker): actualizar Dockerfile
build(webpack): optimizar configuración
build: añadir script de build para producción
```

#### `ci` - Integración Continua
Cambios en archivos de configuración de CI/CD.

**Ejemplos:**
```bash
ci(github): añadir workflow de tests
ci(docker): configurar pipeline de deploy
ci: agregar validación de commits
```

---

## 🎯 Alcances (Scopes)

El alcance especifica qué parte del código fue modificada.

### Alcances Comunes en Wise Auth

| Alcance | Descripción |
|---------|-------------|
| `auth` | Módulo de autenticación |
| `jwt` | Tokens JWT |
| `google` | OAuth de Google |
| `guards` | Guards y protección de rutas |
| `roles` | Sistema de roles |
| `decorators` | Decoradores personalizados |
| `dto` | Data Transfer Objects |
| `prisma` | Base de datos y ORM |
| `config` | Configuración del proyecto |
| `strategies` | Estrategias de Passport |
| `swagger` | Documentación de API |
| `tests` | Tests unitarios o E2E |
| `deps` | Dependencias |

### Alcances Opcionales

El alcance puede omitirse si el cambio es global o afecta múltiples áreas.

```bash
# Con alcance
feat(auth): agregar login con Facebook

# Sin alcance (cambio global)
chore: actualizar todas las dependencias
```

---

## 💡 Ejemplos Prácticos

### Commit Simple

```bash
git commit -m "feat(auth): agregar autenticación con Facebook"
```

### Commit con Cuerpo

```bash
git commit -m "feat(auth): agregar autenticación con Facebook

Implementa OAuth 2.0 con Facebook para permitir a los usuarios
iniciar sesión usando sus cuentas de Facebook. Esto proporciona
una alternativa adicional al login con Google existente.

- Añadida FacebookStrategy
- Actualizado AuthModule con nuevo provider
- Creados endpoints /auth/facebook y /auth/facebook/callback"
```

### Commit con Breaking Change

```bash
git commit -m "feat(auth)!: cambiar estructura de response del login

BREAKING CHANGE: El endpoint /auth/google/callback ahora retorna
la estructura { token, user } en lugar de { access_token, userData }.

Los clientes deben actualizar su código para usar la nueva estructura.

Migración:
- Cambiar access_token por token
- Cambiar userData por user"
```

### Commit de Corrección con Issue

```bash
git commit -m "fix(jwt): corregir validación de tokens expirados

Los tokens expirados no estaban siendo rechazados correctamente
debido a un error en la configuración de ignoreExpiration.

Closes #123"
```

### Commit de Documentación

```bash
git commit -m "docs(api): actualizar documentación de Swagger

- Añadidos ejemplos de uso para cada endpoint
- Documentados códigos de error
- Actualizada descripción de modelos de datos"
```

### Commit de Refactorización

```bash
git commit -m "refactor(guards): extraer lógica común de guards

Se crea una clase base AbstractGuard con la lógica compartida
entre JwtAuthGuard y RolesGuard para reducir duplicación
y facilitar mantenimiento."
```

### Commit de Tests

```bash
git commit -m "test(auth): aumentar cobertura de Google OAuth

- Añadidos tests para usuario nuevo
- Añadidos tests para usuario existente
- Añadidos tests para errores de Google
- Cobertura aumentada de 65% a 85%"
```

---

## ✅ Reglas y Buenas Prácticas

### Reglas Obligatorias

1. **Usar minúsculas** en tipo y alcance
   ```bash
   ✅ feat(auth): descripción
   ❌ Feat(Auth): Descripción
   ```

2. **No terminar con punto** la descripción corta
   ```bash
   ✅ feat(auth): agregar login
   ❌ feat(auth): agregar login.
   ```

3. **Usar imperativo** ("agregar" no "agregado" ni "agrega")
   ```bash
   ✅ feat: agregar nueva funcionalidad
   ❌ feat: agregada nueva funcionalidad
   ❌ feat: agrega nueva funcionalidad
   ```

4. **Primera línea máximo 72 caracteres**
   ```bash
   ✅ feat(auth): agregar autenticación con Facebook OAuth 2.0
   ❌ feat(auth): agregar autenticación con Facebook OAuth 2.0 para permitir login alternativo
   ```

5. **Dejar línea en blanco** antes del cuerpo
   ```bash
   ✅ feat(auth): agregar login
   
   Descripción detallada...
   
   ❌ feat(auth): agregar login
   Descripción detallada...
   ```

### Buenas Prácticas

#### ✅ DO - Hacer

- **Ser específico y descriptivo**
  ```bash
  ✅ fix(jwt): corregir validación de expiración de tokens
  ❌ fix: corregir bug
  ```

- **Commits atómicos**: Un commit = Un cambio lógico
  ```bash
  ✅ Commit 1: feat(auth): agregar Facebook OAuth
  ✅ Commit 2: docs(readme): documentar Facebook OAuth
  
  ❌ Commit 1: feat(auth): agregar Facebook OAuth y actualizar README y corregir bug
  ```

- **Explicar el POR QUÉ, no el CÓMO**
  ```bash
  ✅ "Se cambia a bcrypt porque argon2 tiene problemas de compatibilidad"
  ❌ "Se cambia hashPassword() para usar bcrypt.hash()"
  ```

- **Referenciar issues**
  ```bash
  ✅ fix(auth): resolver error de callback
  
  Closes #123
  Related to #124
  ```

#### ❌ DON'T - No Hacer

- **Commits genéricos**
  ```bash
  ❌ fix: correcciones varias
  ❌ feat: cambios
  ❌ chore: update
  ```

- **Mezclar múltiples cambios**
  ```bash
  ❌ feat(auth): agregar Facebook, corregir bug de Google, actualizar README
  ```

- **Describir el código en lugar del cambio**
  ```bash
  ❌ feat(auth): crear FacebookStrategy.ts con método validate
  ✅ feat(auth): agregar autenticación con Facebook
  ```

---

## 🚨 Commits Especiales

### Breaking Changes

Indica cambios que rompen compatibilidad hacia atrás.

**Formato 1: Con `!` después del alcance**
```bash
feat(api)!: cambiar estructura de respuesta de login

BREAKING CHANGE: La respuesta ahora usa 'token' en lugar de 'access_token'
```

**Formato 2: En el footer**
```bash
feat(api): cambiar estructura de respuesta de login

BREAKING CHANGE: La respuesta ahora usa 'token' en lugar de 'access_token'.
Los clientes deben actualizar sus integraciones.
```

### Revert

Para revertir un commit anterior.

```bash
revert: revert "feat(auth): agregar autenticación con Facebook"

This reverts commit 1234567890abcdef.

Razón: La funcionalidad causaba conflictos con el sistema de sesiones.
```

### Co-authored

Para commits colaborativos.

```bash
feat(auth): implementar sistema de 2FA

Co-authored-by: John Doe <john@example.com>
Co-authored-by: Jane Smith <jane@example.com>
```

---

## 🛠️ Herramientas Recomendadas

### Commitizen

Asistente interactivo para crear commits.

```bash
# Instalar
npm install -g commitizen
npm install --save-dev cz-conventional-changelog

# Configurar en package.json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}

# Usar
git cz
```

### Commitlint

Valida que los commits sigan la convención.

```bash
# Instalar
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Configurar commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional']
};

# Usar con Husky
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Husky

Git hooks para validar commits antes de hacerlos.

```bash
# Instalar
npm install --save-dev husky

# Inicializar
npx husky install

# Añadir hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Standard Version

Automatiza el versionado y changelog.

```bash
# Instalar
npm install --save-dev standard-version

# Añadir script en package.json
{
  "scripts": {
    "release": "standard-version"
  }
}

# Usar
npm run release
```

---

## 📊 Ejemplos Completos por Escenario

### Escenario 1: Nueva Funcionalidad Grande

```bash
feat(auth): implementar autenticación de dos factores

Se añade soporte completo para 2FA usando TOTP (Time-based One-Time Password).
Los usuarios pueden habilitar 2FA desde su perfil y se requerirá un código
adicional después del login con Google.

Características:
- Generación de QR code para apps autenticadoras
- Códigos de respaldo de emergencia
- Opción para recordar dispositivo por 30 días
- Endpoint para validar código TOTP

Closes #156
Related to #145, #148
```

### Escenario 2: Bug Crítico

```bash
fix(jwt)!: corregir vulnerabilidad en validación de tokens

BREAKING CHANGE: Los tokens generados con la versión anterior
ya no serán válidos. Los usuarios deberán volver a iniciar sesión.

Se detectó que el campo 'role' en el payload del JWT no estaba
siendo validado correctamente, permitiendo potencialmente
escalación de privilegios.

Closes #234
```

### Escenario 3: Refactorización Mayor

```bash
refactor(auth): modularizar sistema de autenticación

Se divide el AuthService en servicios especializados para
mejorar la mantenibilidad y testabilidad:

- GoogleAuthService: Maneja lógica de Google OAuth
- JwtService: Generación y validación de tokens
- UserService: Gestión de usuarios

No hay cambios en la API pública, solo reorganización interna.

Related to #189
```

### Escenario 4: Actualización de Dependencias

```bash
chore(deps): actualizar dependencias de seguridad

Actualiza paquetes con vulnerabilidades conocidas:
- @nestjs/jwt: 10.0.0 -> 11.0.1 (CVE-2023-12345)
- passport-jwt: 4.0.0 -> 4.0.1 (CVE-2023-67890)

npm audit fix ejecutado exitosamente.
```

### Escenario 5: Documentación Completa

```bash
docs: crear documentación completa de API con Swagger

Se implementa documentación interactiva de todos los endpoints:

- Configurado Swagger UI en /api/docs
- Añadidos decoradores @ApiOperation y @ApiResponse
- Documentados todos los DTOs con @ApiProperty
- Creada guía de uso en docs/API_DOCUMENTATION.md
- Actualizado README.md con sección de Swagger

Closes #98
```

---

## 📚 Referencias

- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
- [Semantic Versioning](https://semver.org/lang/es/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Commitizen](http://commitizen.github.io/cz-cli/)
- [Commitlint](https://commitlint.js.org/)

---

## ❓ FAQ

### ¿Qué hago si mi cambio afecta múltiples áreas?

Usa el tipo más relevante y omite el alcance, o divide en múltiples commits.

```bash
# Opción 1: Sin alcance
refactor: reorganizar estructura del proyecto

# Opción 2: Múltiples commits
git commit -m "refactor(auth): mover estrategias a carpeta strategies"
git commit -m "refactor(guards): mover guards a carpeta guards"
```

### ¿Puedo combinar tipos?

No. Cada commit debe tener un solo tipo. Si necesitas múltiples tipos, haz múltiples commits.

### ¿Cómo escribo commits en español o inglés?

El proyecto usa **español** para los mensajes de commit. Mantén la consistencia con el equipo.

### ¿Qué pasa si me equivoco en un commit?

Puedes modificar el último commit:
```bash
git commit --amend
```

O hacer un commit de corrección:
```bash
git commit -m "fix(auth): corregir typo en mensaje de commit anterior"
```

---

## ✨ Resumen Rápido

```bash
# Formato básico
<tipo>(<alcance>): <descripción>

# Tipos más comunes
feat      # Nueva funcionalidad
fix       # Corrección de bug
docs      # Documentación
refactor  # Refactorización
test      # Tests
chore     # Mantenimiento

# Ejemplos rápidos
feat(auth): agregar login con Facebook
fix(jwt): corregir validación de tokens
docs(readme): actualizar instalación
refactor(guards): simplificar lógica
test(auth): añadir tests de OAuth
chore(deps): actualizar dependencias
```

---

**Última actualización:** 17 de noviembre de 2025  
**Versión:** 1.0.0  
**Equipo:** DOSW2025