[![CI](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml/badge.svg)](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml)

> **CI (integracion continua):** el badge indica si las comprobaciones automaticas en GitHub Actions (`lint`, `typecheck` y `tests`) pasan.
> Verde: ultima ejecucion correcta. Rojo: alguna validacion fallida.
> El badge enlaza al detalle de cada ejecucion.

Aplicacion **ReadTracker / Scriptorium** en React Native + Expo: misma API backend para **app nativa**, **Expo Web** (p. ej. Vercel) y flujo Pro unificado.

## Que es esta app y para que sirve

ReadTracker organiza la lectura personal: libros, pagina actual y progreso en el tiempo.

Funcionalidades para la persona lectora:

- **Inicio**: lectura actual, resumen rápido y carrusel de libros terminados
- Biblioteca personal de libros (búsqueda, filtros y scroll infinito)
- Progreso por paginas al avanzar en la lectura
- Historial de lectura por fechas
- Estadisticas de habitos de lectura
- Lista de deseos y registro de compras (pantalla de compras accesible desde el menú, no en la barra inferior)

## Stack

- Expo SDK 54 + React Native + TypeScript
- Expo Router para navegacion por rutas
- React Query para estado remoto
- Zustand para estado local/persistente
- React Native Paper (componentes MD3)
- **Firebase Auth** (cliente, email/contraseña) + **Firestore** (perfil de usuario en colección `users`)
- **Firebase Admin** en la API (validación de ID token en rutas protegidas)
- **PostgreSQL** (p. ej. Neon) para libros, sesiones de lectura, wishlist y facturación
- **Stripe** (Payment Intent + webhook) para activar **Scriptorium Pro**
- **AWS S3** (opcional): subida de portadas con **URL firmada** (`PUT` directo al bucket tras validar Firebase en la API)

## Funcionalidades implementadas

- **Autenticacion**
  - Login y registro con **Firebase Auth** (email/contraseña)
  - Pantalla de login con branding **Scriptorium** (logo, tono marrón claro del tema de la app)
  - Botones de Google y Apple visibles en UI; **aún no conectados** (muestran aviso «Próximamente»)
  - Perfil de usuario en **Firestore** (`getMe` / `updateMe` en cliente); la API valida el **ID token** de Firebase en el resto de dominios
- **Navegacion principal (5 pestañas)**
  - **Inicio**, **Biblioteca**, **Historial**, **Estadísticas**, **Wishlist**
  - Sin botón flotante «+» en la barra inferior; el alta de libro está en **Biblioteca** (botón «Añadir libro» bajo la búsqueda)
  - Ajustes y perfil desde el icono de engranaje (menú / perfil), no como pestaña visible
- **Biblioteca**
  - Listado paginado con **carga automática al hacer scroll** (sin botón «Cargar más»)
  - Busqueda y filtros (pantalla dedicada de filtros en móvil)
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
  - `app/(auth)/`: login y registro (cabecera de stack oculta en login)
  - `app/(app)/(tabs)/`: **home** (inicio), **index** (biblioteca), **history**, **stats**, **wishlist**
  - `app/(app)/app-menu.tsx`, `profile.tsx`, `settings.tsx`: menú y cuenta
  - `app/(app)/library-filters.tsx`, `wishlist-filters.tsx`: filtros en móvil
  - `app/(app)/books/[id].tsx`: detalle del libro
  - `app/(app)/books/new.tsx`, `edit.tsx`: alta y edición de libro
  - `app/(app)/upgrade.tsx`: activación Pro
  - Rutas ocultas de tabs: `add` (legacy), `purchases` (compras, `href: null`)
- `src/features/`: modulos por dominio
- `src/shared/`: API client, hooks y UI compartida
- `server/`: API Express (TypeScript), migraciones SQL, Vitest
- `docs/`: idea de producto, planes de prueba, borrador legal Pro (ver abajo)
- `e2e/`: flows de Maestro

## PUNTOS A DESTACAR

- `Producto real`, no solo demo: app de seguimiento lector con inicio, biblioteca, progreso por páginas, historial mensual, estadísticas y wishlist/compras.
- `Identidad Scriptorium`: login y cabeceras con marca propia (logo en `assets/images/logo.png`).
- `Multiplataforma con un solo código`: funciona en móvil (Expo) y web, compartiendo la misma API.
- `Autenticación sólida`: Firebase Auth en cliente; perfil en Firestore; validación de ID token en backend para libros, sesiones y facturación.
- `Backend completo propio`: API en Express + TypeScript + PostgreSQL, con endpoints por dominio (auth, books, reading-sessions, wishlist, billing).
- `Pago integrado con Stripe`: flujo de prueba gratis + activación de plan Pro con webhook de confirmación en backend.
- `Calidad de ingeniería`: CI en GitHub Actions con lint, typecheck y tests; además E2E con Maestro para flujos críticos.
- `Arquitectura mantenible`: separación por features (src/features) y compartidos (src/shared), React Query para estado remoto y Zustand para estado local.
- `Gestión del proyecto`: Kanban en Trello con reglas de avance (Backlog → Done) y criterios de aceptación.
- `Escalabilidad técnica`: soporte para subida de imágenes con presigned URLs a S3 y consideraciones CORS para web.
- `Enfoque de rendimiento y UX`: plan de pruebas de FPS, listas grandes, y validación de tema claro/oscuro.

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

Variables **Firebase** en `.env`: ver `.env.example` (login/registro).

En **servidor** (`server/.env`; copia desde `server/.env.example`):

- **Obligatorias en producción:** Firebase Admin, `DATABASE_URL`, orígenes CORS (`CLIENT_ORIGIN` o `CLIENT_ORIGINS`), Stripe si hay cobros.
- **Opcional — subida de portadas S3:** `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Sin ellas, `POST /uploads/cover` responde 503 y solo funcionan portadas por URL externa / búsqueda online.

### Donde va cada secreto (dos frontends, un backend)

| Secreto / variable                                              | ¿Render (API)? | ¿Vercel (web estática)?      |
| --------------------------------------------------------------- | -------------- | ---------------------------- |
| `DATABASE_URL`, Firebase Admin, Stripe **secret**, webhook      | Sí             | No                           |
| Claves **AWS** S3                                               | Sí             | **No** (nunca en el cliente) |
| `EXPO_PUBLIC_*` (API URL, Firebase web, Stripe **publishable**) | No             | Sí                           |

Con **varios dominios web** (p. ej. Vercel producción + otro), declarar **todos** en `CLIENT_ORIGINS` (API) y en **CORS del bucket S3** (`AllowedOrigins`) si hay subida de fotos desde la web.

### Stripe (modo prueba)

- El backend debe tener `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- La app usa `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` para mostrar el checkout en web.
- **Modelo de producto:** prueba gratuita con app completa; despues **un pago unico** (Payment Intent “lifetime” en backend) que marca la cuenta como **Pro** sin renovaciones automaticas. Comercialmente se comunica como **licencia de uso** de la app para esa cuenta **mientras el servicio este disponible**.
- En **movil**, el boton de pago abre el navegador en `/upgrade` de la web desplegada: `EXPO_PUBLIC_WEB_APP_ORIGIN` = URL de Vercel (sin `/` final).

### Textos legales / condiciones

No hay en este repo condiciones generales ni politica de privacidad definitivas. Para produccion, los textos legales suelen publicarse tras revision profesional y enlazarse desde registro, checkout y perfil. **Referencia de producto** (borrador, sin valor legal): `docs/compra-pro-licencia-perpetua-borrador-es.md`.

## Documentacion en `docs/`

| Archivo                                       | Contenido                                             |
| --------------------------------------------- | ----------------------------------------------------- |
| `idea.md`                                     | Problema, usuario objetivo y alcance MVP del producto |
| `project-management.md`                       | Tablero Trello y flujo Kanban                         |
| `test-plan-production.md`                     | Prioridades de tests funcionales                      |
| `performance-test-plan.md`                    | Listas grandes y contraste claro/oscuro               |
| `react-native-teoria.md`                      | Notas de contexto RN / Expo                           |
| `compra-pro-licencia-perpetua-borrador-es.md` | Borrador comercial Pro (no legal)                     |

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
  Evitar `vitest` / `npx vitest` desde la raíz del monorepo: mezcla tests del servidor con el cliente y provoca errores CJS/ESM.
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

- Maestro CLI instalado y accesible (`maestro` en PATH, o ruta completa al ejecutable en Windows, p. ej. `maestro.bat`)

### 2) Ejecutar flow smoke

En PowerShell, desde la raiz del repo (ajustar credenciales y URL de Expo):

```powershell
cd <raiz-del-repo>
$env:MAESTRO_APP_URL="exp://TU_URL_DE_EXPO"; $env:MAESTRO_EMAIL="..."; $env:MAESTRO_PASSWORD="..."; maestro test .\e2e\smoke-login-library.yaml
```

### 3) Ejecutar flow marcar pagina + historial

```powershell
cd <raiz-del-repo>
$env:MAESTRO_APP_URL="exp://TU_URL_DE_EXPO"; $env:MAESTRO_EMAIL="..."; $env:MAESTRO_PASSWORD="..."; $env:MAESTRO_READING_BOOK_TITLE="..."; $env:MAESTRO_NEXT_PAGE="..."; maestro test .\e2e\mark-page-history.yaml
```

## Troubleshooting rapido (Maestro)

- **`maestro` no se reconoce**
  - Usar la ruta completa al ejecutable o añadir su carpeta al `PATH`.
- **`You have 0 devices connected`**
  - Inicia emulador/dispositivo y verifica con `adb devices`.
- **Timeouts o errores `UNAVAILABLE/DEADLINE_EXCEEDED`**
  - Reinicia ADB:

```powershell
adb kill-server; adb start-server; adb devices
```

## Mejoras posibles en E2E / CI

- Mas `testID` en pantallas criticas (p. ej. historial) para reducir dependencia de coordenadas.
- Opcional: flujo Maestro adicional mas estricto para CI frente al smoke local.

## TRELLO

- Tablero: [https://trello.com/b/3e8Vo53T/readtrucker-movile]
