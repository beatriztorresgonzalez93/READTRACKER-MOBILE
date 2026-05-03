# Plan de tests funcionales (produccion)

Este plan prioriza tests que reducen riesgo real en despliegue, no solo cobertura cosmetica.

## Prioridad alta (ya implementado)

- Mutaciones de lectura:
  - `useCreateReadingSession`: invalida caches de historial, stats y libros.
  - `useDeleteReadingSession`: invalida caches para refrescar todo el flujo.
- Normalizacion y URLs de media:
  - `normalizeBook` y `resolveBookCoverUrl` para tolerar respuestas backend variables.
- Auth Firebase:
  - Login/registro contra Firebase; llamadas API con Bearer (ID token).
- Formularios web:
  - `apply-web-autocapitalize` + tests unitarios para titulos/autores en navegador.

## Prioridad media (siguiente fase)

- Flujos de pantalla:
  - Biblioteca: buscar + filtrar + ordenar.
  - Detalle libro: marcar pagina y refresco de progreso.
  - Historial: eliminar sesion y actualizacion visual.
  - Alta/edición libro: buscar portada online; si S3 esta configurado, subir imagen y comprobar que la URL publica se guarda y se muestra en biblioteca y detalle (nativo y web).
- Manejo de errores:
  - Timeouts/API 500 con mensajes de fallback.
  - Sin variables S3 en servidor: `POST /uploads/cover` debe degradar con mensaje claro (solo URL externa / busqueda).

## Prioridad release (pre-produccion)

- E2E smoke tests:
  - Login -> Biblioteca -> Detalle -> Marcar pagina -> Historial.
  - Wishlist -> Comprar/eliminar -> Estadisticas.
  - (Opcional) Web: subida de portada con bucket CORS correcto; API con `CLIENT_ORIGINS` que incluya el dominio Vercel.

## Comandos

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run test:coverage
npm run test:server
```
