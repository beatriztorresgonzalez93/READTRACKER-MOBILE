# ReadTracker Mobile (Expo)

[![CI](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml/badge.svg)](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml)

> **CI (Integracion continua):** este indicador muestra si las comprobaciones automaticas del proyecto estan pasando en GitHub Actions (`lint`, `typecheck` y `tests`).
> Si aparece en verde, la ultima ejecucion fue correcta. Si aparece en rojo, alguna validacion fallo.
> Puedes hacer clic en el badge para ver el detalle de cada ejecucion.

Aplicacion movil de ReadTracker construida con React Native + Expo y conectada a la API del proyecto web.

## Que es esta app y para que sirve

ReadTracker Mobile es una app para llevar tu lectura al dia de forma simple.
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
- Expo Secure Store para JWT

## Funcionalidades implementadas

- **Autenticacion**
  - Login y registro
  - Persistencia segura de sesion
  - Restauracion de usuario con `GET /auth/me`
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

## Estructura principal

- `app/`: rutas Expo Router
  - `app/(auth)/`: login y registro
  - `app/(app)/(tabs)/`: biblioteca, historial, stats, wishlist, perfil
  - `app/(app)/books/[id].tsx`: detalle del libro
- `src/features/`: modulos por dominio
- `src/shared/`: API client, hooks y UI compartida
- `e2e/`: flows de Maestro

## Instalacion y configuracion

1) Instalar dependencias:

```bash
npm install
```

2) Crear archivo de entorno:

```bash
cp .env.example .env
```

3) Configurar backend en `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://readtracker-api.onrender.com/api/v1
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Stripe (modo prueba)

- El backend debe tener `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- La app usa `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` para mostrar el checkout en web.
- Flujo actual Pro: trial gratis y luego pago único para desbloquear estadísticas Pro.

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
- Test unit/integration (CI): `npm run test:ci`
- Cobertura: `npm run test:coverage`

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
