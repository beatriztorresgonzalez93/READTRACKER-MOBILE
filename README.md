[![CI](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml/badge.svg)](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml)

> **CI:** el badge indica si pasan en GitHub Actions `lint`, `typecheck` y tests de la app. Verde = OK; rojo = revisar el workflow.

Aplicación **ReadTracker / Scriptorium** en React Native + Expo: misma API para **app nativa**, **Expo Web** (p. ej. Vercel) y flujo Pro unificado.

## Qué es esta app y para qué sirve

ReadTracker organiza la lectura personal: libros, página actual y progreso en el tiempo.

Funcionalidades para la persona lectora:

- **Inicio**: lectura actual, resumen rápido y carrusel de libros terminados
- **Biblioteca** personal (búsqueda, filtros, scroll infinito)
- **Alta de libro** con búsqueda de portada, subida a S3 y **escaneo o entrada de ISBN**
- Progreso por páginas y **historial** de lectura
- **Estadísticas** de hábitos de lectura
- **Wishlist** y registro de **compras** (accesible desde el menú; no en la barra inferior)

## Stack

| Capa | Tecnología |
|------|------------|
| Cliente | Expo SDK 54, React Native, TypeScript, Expo Router |
| UI | **Gluestack UI** + componentes compartidos (`AppButton`, `AppInput`, `Screen`, etc.) |
| Estado | React Query (remoto), Zustand (local / borrador de formularios) |
| Auth cliente | Firebase Auth (email/contraseña) |
| Perfil | Firestore (`users`) |
| API | Express 5 + TypeScript en `server/` |
| Auth API | Firebase Admin (ID token en rutas protegidas) |
| Datos | PostgreSQL (p. ej. Neon): libros, sesiones, wishlist, facturación |
| Pagos | Stripe (Payment Intent + webhook) → **Scriptorium Pro** |
| Portadas (opc.) | AWS S3 con URL firmada (`POST /uploads/cover`) |
| Metadatos ISBN (opc.) | Groq / OpenAI / Gemini en servidor; fallback local MyMemory en cliente |

## Funcionalidades implementadas

### Autenticación y navegación

- Login y registro con **Firebase Auth**; pantalla con branding Scriptorium (`assets/images/logo.png`)
- Google y Apple visibles en UI; **aún no conectados** (aviso «Próximamente»)
- **5 pestañas:** Inicio, Biblioteca, Historial, Estadísticas, Wishlist
- Ajustes y perfil desde el engranaje (no como pestaña)
- Alta de libro desde **Biblioteca** → «Añadir libro» (sin FAB global en tabs)

### Biblioteca y libros

- Listado paginado con **scroll infinito**
- Búsqueda, filtros (pantalla dedicada en móvil) y resumen (`GET /books/summary`)
- Detalle de libro, edición, borrado
- Marcado de progreso (`POST /reading-sessions`)

### Alta de libro: portadas e ISBN

- **Buscar portada online:** `GET /api/v1/covers/search` (Open Library + Google Books en servidor; evita CORS en web)
- **Subir imagen:** `POST /api/v1/uploads/cover` → presign S3 → `PUT` directo al bucket
- **Escanear código de barras (ISBN)** en móvil (`expo-camera`) o **escribir ISBN** en web
- Relleno automático del formulario:
  1. APIs públicas (Open Library + Google Books)
  2. Catálogo local de ISBN muy conocidos (p. ej. saga *Empíreo*)
  3. IA en servidor (`POST /books/metadata/enrich` y `discover-isbn`) si hay `GROQ_API_KEY` (u OpenAI/Gemini)
  4. Traducción / género en cliente (MyMemory) si hace falta
- Portadas sin imagen: **color + título** en la rejilla (no icono vacío)
- Conversión **ISBN-10 → ISBN-13** cuando el escáner devuelve 10 dígitos

### Historial, estadísticas, wishlist

- Historial mensual con calendario de intensidad
- Estadísticas (rachas, sesiones, páginas, promedios)
- Wishlist: alta/baja, marcar comprado, listado de adquisiciones

### Plan Pro

- Prueba gratuita (`EXPO_PUBLIC_PRO_TRIAL_DAYS` / `PRO_TRIAL_DAYS`)
- Tras la prueba: **un pago único** activa Pro de forma permanente para esa cuenta (sin suscripción)
- Sin Pro tras la prueba: navegación principal bloqueada; siguen **Upgrade** y **perfil**
- En móvil, el checkout abre la web (`EXPO_PUBLIC_WEB_APP_ORIGIN` + `/upgrade`)

## Estructura del repositorio

```
app/                    # Rutas Expo Router
  (auth)/               # login, register
  (app)/(tabs)/         # home, index (biblioteca), history, stats, wishlist
  (app)/books/          # [id], new, edit, pantallas auxiliares
  (app)/upgrade.tsx, library-filters.tsx, ...
src/features/           # Dominio (books, auth, billing, …)
src/shared/             # API, hooks, UI, utilidades ISBN
server/                 # API Express, migraciones SQL, scripts
  scripts/              # seed-books.js, clear-fake-seed-covers.js, …
docs/                   # Producto, pruebas, borrador legal Pro
e2e/                    # Flows Maestro
```

### API relevante (prefijo `/api/v1`)

| Área | Rutas (ejemplos) |
|------|-------------------|
| Salud | `GET /health` → incluye `aiBookMetadataConfigured` |
| Libros | `GET/POST /books`, `GET /books/summary`, `GET/PUT/DELETE /books/:id` |
| Metadatos ISBN | `POST /books/metadata/enrich`, `POST /books/metadata/discover-isbn` |
| Portadas | `GET /covers/search` |
| Subidas | `POST /uploads/cover` |
| Sesiones | `POST /reading-sessions`, … |
| Wishlist / billing | según módulos en `server/src/routes/` |

## Ramas y despliegue

- **`main`** y **`version-pro`** están alineadas (mismo código de producto).
- **API (Render):** servicio Node con **Root Directory** `server`, variables de `server/.env.example`. URL típica: `https://readtracker-api.onrender.com/api/v1`.
- **Web (Vercel):** `npm run build:web`; `vercel.json` reescribe `/api/v1/*` al backend en Render (útil si en web dejas `EXPO_PUBLIC_API_BASE_URL` vacío o relativo).

## Instalación

```bash
npm install
cp .env.example .env
cp server/.env.example server/.env
```

### Variables de la app (`.env`)

Ver `.env.example`. Imprescindibles para desarrollo:

```env
EXPO_PUBLIC_API_BASE_URL=https://readtracker-api.onrender.com/api/v1
# Firebase (EXPO_PUBLIC_FIREBASE_*)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_WEB_APP_ORIGIN=https://tu-app.vercel.app
EXPO_PUBLIC_PRO_TRIAL_DAYS=30
```

- **Expo web en local (:8081)** contra API en Render: en Render, `CORS_ALLOW_LOCALHOST=true` o lista tu origen en `CLIENT_ORIGINS`.
- **Expo web contra API local:** `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1` y `cd server && npm run dev`.

### Variables del servidor (`server/.env`)

| Tipo | Variables |
|------|-----------|
| Obligatorias en producción | `DATABASE_URL`, Firebase Admin, `CLIENT_ORIGIN` o `CLIENT_ORIGINS` |
| Stripe (cobros) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| S3 (portadas) | `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| IA metadatos ISBN | `GROQ_API_KEY`, `GROQ_MODEL` (p. ej. `llama-3.3-70b-versatile`) u OpenAI/Gemini |

**Importante:** `GROQ_API_KEY` va en **Render** (servicio del API), no en Vercel.

Tras cambiar variables en Render: **Save** y **redeploy** (o *Clear build cache & deploy*).

### Dónde va cada secreto

| Secreto | Render (API) | Vercel (web) |
|---------|--------------|--------------|
| `DATABASE_URL`, Firebase Admin, Stripe secret, AWS, **Groq** | Sí | No |
| `EXPO_PUBLIC_*` | No | Sí |

### Stripe (modo prueba)

- Backend: `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- App: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Modelo: prueba gratuita + **pago único** (licencia de uso mientras el servicio esté disponible). Borrador comercial: `docs/compra-pro-licencia-perpetua-borrador-es.md` (sin valor legal).

## Ejecutar la app

```bash
npm start
```

Atajos:

```bash
npm run android
npm run ios
npm run web
```

Con caché limpia: `npx expo start -c`

## Ejecutar el API en local

```bash
cd server
npm install
npm run dev
```

Por defecto escucha en el puerto de `PORT` (4000). Health: `http://localhost:4000/api/v1/health`.

Build de producción del servidor:

```bash
cd server
npm run build
npm start
```

## Datos de prueba (biblioteca grande)

Solo en **base de desarrollo**, desde `server/`:

```bash
# Añade libros de ejemplo (p. ej. 1000 en pendiente) sin borrar los tuyos
node scripts/seed-books.js --email tu@correo.com

# Opcional: borrar antes todos los libros de ese usuario
node scripts/seed-books.js --email tu@correo.com --reset

# Quitar URLs de portada ficticias del seed (mejor placeholders en app)
node scripts/clear-fake-seed-covers.js --email tu@correo.com
```

También vía npm: `npm run seed:books` y `npm run seed:clear-covers` (desde `server/`).

## Calidad y testing

| Comando | Qué hace |
|---------|----------|
| `npm run lint` | ESLint (app) |
| `npm run typecheck` | TypeScript app |
| `npm run test:ci` | Jest (CI) |
| `npm run test:coverage` | Cobertura app |
| `npm run test:server` | Vitest en `server/` |
| `npm run test:server:e2e` | E2E API con DB real (`DATABASE_URL`) |

No ejecutes Vitest desde la raíz del monorepo mezclando app y servidor.

## E2E con Maestro (Android + Expo Go)

Flows en `e2e/`:

- `smoke-login-library.yaml`
- `mark-page-history.yaml`

```bash
npm run e2e:maestro:smoke
npm run e2e:maestro:mark-page
```

Prerrequisitos: dispositivo/emulador (`adb devices`), Expo con tunnel (`npm start -- --tunnel -c`), Maestro en PATH.

Ejemplo PowerShell:

```powershell
$env:MAESTRO_APP_URL="exp://TU_URL_EXPO"
$env:MAESTRO_EMAIL="tu@email.com"
$env:MAESTRO_PASSWORD="tu_password"
maestro test .\e2e\smoke-login-library.yaml
```

## Troubleshooting

### Render: build falla con `Cannot find module 'zod'`

El servidor necesita `zod` en `server/package.json`. Asegúrate de desplegar un commit reciente y que el **Root Directory** sea `server`.

### Escaneo ISBN: metadatos o IA fallan

- Comprueba que el API desplegado incluye los últimos cambios de metadatos.
- Verifica `GROQ_API_KEY` en **Render** y redeploy.
- En el error, revisa **ISBN leído:** debe ser el del libro (978… / 979…), no una etiqueta de precio.
- Edición española *Alas de sangre* (ej.): `9788408316084`.

### Maestro

- `maestro` no reconocido → ruta completa o PATH.
- Sin dispositivos → `adb kill-server; adb start-server; adb devices`

## Documentación en `docs/`

| Archivo | Contenido |
|---------|-----------|
| `idea.md` | Problema, usuario y MVP |
| `project-management.md` | Trello y Kanban |
| `test-plan-production.md` | Tests funcionales |
| `performance-test-plan.md` | Listas grandes y rendimiento |
| `react-native-teoria.md` | Notas RN / Expo |
| `compra-pro-licencia-perpetua-borrador-es.md` | Borrador comercial Pro (no legal) |

## Puntos a destacar

- Producto real de seguimiento lector (no solo demo): biblioteca, progreso, historial, estadísticas, wishlist.
- **Multiplataforma** con un código (Expo nativo + web).
- **ISBN y metadatos en español** con APIs públicas + IA opcional en servidor.
- Backend propio (Express + PostgreSQL) con CI en GitHub Actions.
- Stripe para Pro; S3 opcional para portadas; CORS documentado para Vercel y Expo local.

## Gestión del proyecto

Tablero Trello: [readtrucker-movile](https://trello.com/b/3e8Vo53T/readtrucker-movile)
