# ReadTracker Mobile (Expo)

[![CI](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml/badge.svg)](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml)

> **CI (Integracion continua):** este indicador muestra si las comprobaciones automaticas del proyecto estan pasando en GitHub Actions (`lint`, `typecheck` y `tests`).
> Si aparece en verde, la ultima ejecucion fue correcta. Si aparece en rojo, alguna validacion fallo.
> Puedes hacer clic en el badge para ver el detalle de cada ejecucion.

Aplicacion **ReadTracker / Scriptorium** en React Native + Expo: misma API backend para **app nativa**, **Expo Web** (p. ej. Vercel) y flujo Pro unificado.

## Que es esta app y para que sirve

ReadTracker es una app para llevar tu lectura al dia de forma simple.
Te ayuda a organizar tus libros, recordar por que pagina vas y ver tu progreso con el tiempo.

Como usuario, puedes:

- Guardar libros en tu biblioteca personal
- Marcar paginas leidas cuando avanzas
- Consultar tu historial de lectura por fechas
- Ver estadisticas para entender tus habitos de lectura
- Crear una lista de deseos y pasar libros a comprados

## Stack

- Expo SDK 54 + React Native + TypeScript
- Expo Router para navegacion por rutas
- React Query para estado remoto
- Zustand para estado local/persistente
- React Native Paper (componentes MD3)
- **Firebase Auth** (cliente) + **Firebase Admin** en la API (validación de ID token)
- **PostgreSQL** (p. ej. Neon) para datos de usuario, libros, sesiones, wishlist y facturación
- **Stripe** (Payment Intent + webhook) para activar **Scriptorium Pro**
- **AWS S3** (opcional): subida de portadas con **URL firmada** (`PUT` directo al bucket tras validar Firebase en la API)

## Funcionalidades implementadas

- **Autenticacion**
  - Login y registro con **Firebase Auth** (email/contraseña)
  - La API valida **ID tokens de Firebase** (Firebase Admin en el servidor)
  - Persistencia de sesión Firebase + perfil con `GET /auth/me`
- **Biblioteca**
  - Listado paginado de libros
  - Busqueda y filtros
  - Resumen de biblioteca (`/books/summary`)
- **Detalle de libro**
  - Vista completa del libro
  - Marcado de progreso por pagina (`POST /reading-sessions`)
  - Validaciones de pagina y calculo de avance
- **Historial y estadisticas**
  - Historial mensual con calendario de intensidad
  - Estadisticas de lectura (rachas, sesiones, paginas, promedio)
- **Wishlist y compras**
  - Alta/baja de deseos
  - Marcado como comprado
  - Registro y listado de adquisiciones
- **Plan Pro (compra unica)**
  - Periodo de prueba gratuita con acceso completo a la app (`EXPO_PUBLIC_PRO_TRIAL_DAYS`)
  - Tras la prueba: un solo pago activa **Scriptorium Pro** de forma permanente para esa cuenta (sin cuota mensual), con acceso a **toda la app**
  - Si la prueba termina sin pago, la navegacion principal queda bloqueada hasta activar Pro; siguen disponibles la pantalla **Upgrade** y el **perfil** (p. ej. para cerrar sesion)
- **Libros: portadas**
  - **Buscar online**: la app llama a `GET /api/v1/covers/search` (servidor usa Open Library y Google Books con `User-Agent` adecuado); evita llamadas directas desde el navegador que suelen fallar (CORS / 503).
  - **Subir imagen**: `POST /api/v1/uploads/cover` (Bearer = ID token Firebase) devuelve URL firmada para `PUT` a **S3**; la URL publica del objeto se guarda como `coverUrl`. En **web**, el bucket debe tener **CORS** que permita `PUT` desde el origen de Vercel (ver `server/.env.example`).
- **Formularios (titulo, autor, etc.)**
  - En **nativo**, `autoCapitalize` lo aplica el teclado.
  - En **web**, `AppInput` aplica una normalización JS (`apply-web-autocapitalize`) porque los navegadores de escritorio ignoran en la práctica esa pista.

## Estructura principal

- `app/`: rutas Expo Router
  - `app/(auth)/`: login y registro
  - `app/(app)/(tabs)/`: biblioteca, historial, stats, wishlist, perfil
  - `app/(app)/books/[id].tsx`: detalle del libro
  - `app/(app)/books/new.tsx`, `edit.tsx`: alta y edición de libro
- `src/features/`: modulos por dominio
- `src/shared/`: API client, hooks y UI compartida
- `server/`: API Express (TypeScript), migraciones SQL, Vitest
- `docs/`: idea de producto, planes de prueba, borrador legal Pro (ver abajo)
- `e2e/`: flows de Maestro

## Instalacion y configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo de entorno:

```bash
cp .env.example .env
```

3. Configurar backend en `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://readtracker-api.onrender.com/api/v1
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_WEB_APP_ORIGIN=https://tu-app.vercel.app
EXPO_PUBLIC_PRO_TRIAL_DAYS=30
```

Rellena las variables **Firebase** del `.env` según `.env.example` (necesarias para login/registro).

En **servidor** (`server/.env`; copia desde `server/.env.example`):

- **Obligatorias en producción:** Firebase Admin, `DATABASE_URL`, orígenes CORS (`CLIENT_ORIGIN` o `CLIENT_ORIGINS`), Stripe si usas cobros.
- **Opcional — subida de portadas S3:** `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Sin ellas, `POST /uploads/cover` responde 503 y solo funcionan portadas por URL externa / búsqueda online.

### Donde va cada secreto (dos frontends, un backend)

| Secreto / variable | ¿Render (API)? | ¿Vercel (web estática)? |
|-------------------|----------------|-------------------------|
| `DATABASE_URL`, Firebase Admin, Stripe **secret**, webhook | Sí | No |
| Claves **AWS** S3 | Sí | **No** (nunca en el cliente) |
| `EXPO_PUBLIC_*` (API URL, Firebase web, Stripe **publishable**) | No | Sí |

Si tienes **dos dominios web** (p. ej. Vercel producción + otro), incluye **ambos** en `CLIENT_ORIGINS` (API) y en **CORS del bucket S3** (`AllowedOrigins`) si usas subida de fotos desde la web.

### Stripe (modo prueba)

- El backend debe tener `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- La app usa `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` para mostrar el checkout en web.
- **Modelo de producto:** prueba gratuita con app completa; despues **un pago unico** (Payment Intent de tipo “lifetime” en backend) que marca la cuenta como **Pro** sin renovaciones automaticas. Equivale comercialmente a una **licencia perpetua de uso** de la app para esa cuenta, en la medida en que sigas ofreciendo el servicio.
- En **movil**, el boton de pago abre el navegador en `/upgrade` de tu web; define `EXPO_PUBLIC_WEB_APP_ORIGIN` con la URL de Vercel (sin `/` final).

### Textos legales / condiciones

No hay en este repo condiciones generales ni politica de privacidad definitivas: para produccion conviene publicar documentos revisados por asesoria juridica y enlazarlos desde registro, checkout y perfil. Como **referencia de producto** (borrador, sin valor legal) esta `docs/compra-pro-licencia-perpetua-borrador-es.md`.

## Documentacion en `docs/`

| Archivo | Contenido |
|---------|-----------|
| `idea.md` | Problema, usuario objetivo y alcance MVP del producto |
| `project-management.md` | Enlace Trello y flujo Kanban sugerido |
| `test-plan-production.md` | Prioridades de tests funcionales |
| `performance-test-plan.md` | Listas grandes y contraste claro/oscuro |
| `react-native-teoria.md` | Notas de contexto RN / Expo |
| `compra-pro-licencia-perpetua-borrador-es.md` | Borrador comercial Pro (no legal) |

## Ejecutar la app

```bash
npm run start
```

Atajos:

- `npm run android`
- `npm run ios`
- `npm run web`

## Calidad y testing

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests **app (Expo)** con Jest (lo que usa CI): `npm run test:ci`
- Cobertura app: `npm run test:coverage`
- Tests **backend** (`server/`, Vitest): `npm run test:server`  
  (No ejecutes `vitest`/`npx vitest` desde la raíz del monorepo: mezcla tests del servidor con el cliente y da errores de módulos CJS/ESM.)
- E2E backend con DB real (opcional): `npm run test:server:e2e` (requiere `DATABASE_URL` en entorno)

## E2E con Maestro (Windows + Expo Go)

Este proyecto incluye:

- `e2e/smoke-login-library.yaml`
- `e2e/mark-page-history.yaml`

Y scripts npm:

- `npm run e2e:maestro:smoke`
- `npm run e2e:maestro:mark-page`

### 1) Prerrequisitos

- Android Emulator o dispositivo Android conectado
- `adb devices` debe mostrar al menos 1 dispositivo
- Expo en marcha con tunnel:

```bash
npm start -- --tunnel --clear
```

- Maestro CLI instalado (en este equipo se usa `C:\tools\maestro\maestro\maestro\bin\maestro.bat`)

### 2) Ejecutar flow smoke

En PowerShell:

```powershell
$env:MAESTRO_APP_URL="exp://TU_URL_DE_EXPO"; $env:MAESTRO_EMAIL="tu_email"; $env:MAESTRO_PASSWORD="tu_password"; & "C:\tools\maestro\maestro\maestro\bin\maestro.bat" test "C:\Users\beatr\Desktop\readtracker-mobile\e2e\smoke-login-library.yaml"
```

### 3) Ejecutar flow marcar pagina + historial

En PowerShell:

```powershell
$env:MAESTRO_APP_URL="exp://TU_URL_DE_EXPO"; $env:MAESTRO_EMAIL="tu_email"; $env:MAESTRO_PASSWORD="tu_password"; $env:MAESTRO_READING_BOOK_TITLE="En llamas"; $env:MAESTRO_NEXT_PAGE="120"; & "C:\tools\maestro\maestro\maestro\bin\maestro.bat" test "C:\Users\beatr\Desktop\readtracker-mobile\e2e\mark-page-history.yaml"
```

## Troubleshooting rapido (Maestro)

- **`maestro` no se reconoce**
  - Usa la ruta completa del `.bat` (como en los comandos de arriba), o agrega su carpeta al `PATH`.
- **`You have 0 devices connected`**
  - Inicia emulador/dispositivo y verifica con `adb devices`.
- **Timeouts o errores `UNAVAILABLE/DEADLINE_EXCEEDED`**
  - Reinicia ADB:

```powershell
adb kill-server; adb start-server; adb devices
```

## Pendiente para endurecer CI E2E

- Añadir mas `testID` en pantallas criticas (especialmente `History`) para reducir dependencia de coordenadas.
- Mantener dos flows: uno estable local (actual) y uno estricto para CI.
