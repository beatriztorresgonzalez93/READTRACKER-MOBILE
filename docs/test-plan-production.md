# Plan de tests funcionales (produccion)

Este plan prioriza tests que reducen riesgo real en despliegue, no solo cobertura cosmetica.

## Prioridad alta (ya implementado)

- Mutaciones de lectura:
  - `useCreateReadingSession`: invalida caches de historial, stats y libros.
  - `useDeleteReadingSession`: invalida caches para refrescar todo el flujo.
- Normalizacion y URLs de media:
  - `normalizeBook` y `resolveBookCoverUrl` para tolerar respuestas backend variables.

## Prioridad media (siguiente fase)

- Flujos de pantalla:
  - Biblioteca: buscar + filtrar + ordenar.
  - Detalle libro: marcar pagina y refresco de progreso.
  - Historial: eliminar sesion y actualizacion visual.
- Manejo de errores:
  - Timeouts/API 500 con mensajes de fallback.

## Prioridad release (pre-produccion)

- E2E smoke tests:
  - Login -> Biblioteca -> Detalle -> Marcar pagina -> Historial.
  - Wishlist -> Comprar/eliminar -> Estadisticas.

## Comandos

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run test:coverage
```
