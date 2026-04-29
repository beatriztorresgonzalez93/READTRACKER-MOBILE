# ReadTracker Mobile (Expo)

[![CI](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml/badge.svg)](https://github.com/beatriztorresgonzalez93/READTRACKER-MOBILE/actions/workflows/ci.yml)

App movil de ReadTracker construida con React Native + Expo y conectada a la API existente del proyecto web.

## Stack

- Expo SDK 54 + React Native + TypeScript
- Expo Router para navegacion
- React Query para estado remoto
- Expo Secure Store para persistencia de JWT

## Alcance MVP implementado

- Autenticacion:
  - Login y registro
  - Persistencia segura de sesion
  - Restauracion de usuario con `GET /auth/me`
- Biblioteca:
  - Listado paginado de libros
  - Resumen de biblioteca (`/books/summary`)
  - Carga incremental con boton "Cargar mas"
- Detalle y progreso:
  - Vista detalle por libro
  - Registro de sesion/progreso por pagina (`POST /reading-sessions`)
  - Validaciones basicas de pagina
- Fase extendida:
  - Historial mensual de sesiones y lectura por dia
  - Estadisticas de lectura (rachas, sesiones, paginas y promedio)
  - Wishlist con alta/baja de deseos y marcado como comprado
  - Registro de compras y listado de adquisiciones

## Estructura principal

- `app/`: rutas con Expo Router
  - `app/(auth)/`: login y registro
  - `app/(app)/(tabs)/`: biblioteca y perfil
  - `app/(app)/books/[id].tsx`: detalle y progreso
- `src/features/`: modulos por dominio (`auth`, `books`)
- `src/shared/`: API client, tipos, config, UI comun

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea variables de entorno:

```bash
cp .env.example .env
```

3. Ajusta `.env` si usas otro backend:

```env
EXPO_PUBLIC_API_BASE_URL=https://readtracker-api.onrender.com/api/v1
```

## Ejecutar

```bash
npm run start
```

Atajos:

- `npm run android`
- `npm run ios`
- `npm run web`

## Calidad

- Lint:

```bash
npm run lint
```

- Typecheck:

```bash
npm run typecheck
```

- Tests:

```bash
npm run test:ci
```

- Cobertura:

```bash
npm run test:coverage
```

## Pendiente para paridad completa con web

- Cobertura automatizada de tests de UI/integracion
