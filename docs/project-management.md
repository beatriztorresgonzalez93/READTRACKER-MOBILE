# Gestion del proyecto

Repositorio en GitHub: **READTRACKER-MOBILE**. Estado de CI (`lint`, `typecheck`, tests): badge en el `README.md` de la raiz (GitHub Actions).

## Enlace al tablero de Trello

- Tablero: [https://trello.com/b/3e8Vo53T/readtrucker-movile]

## Como se esta gestionando el trabajo

El trabajo se organiza en un tablero Kanban con las columnas:

- **Backlog**: ideas y funcionalidades pendientes de priorizar.
- **Todo**: tareas seleccionadas para la siguiente iteracion.
- **In Progress**: tareas en desarrollo activo.
- **Review**: tareas finalizadas en codigo, pendientes de revision/validacion.
- **Done**: tareas validadas y cerradas.

Cada funcionalidad principal del MVP se representa con una tarjeta principal y un checklist de subtareas tecnicas (UI, logica, integracion API, validaciones y pruebas manuales).

## Criterio para mover tarjetas

- **Backlog -> Todo**: la tarea esta definida, tiene alcance claro y prioridad para la iteracion.
- **Todo -> In Progress**: se comienza implementacion efectiva en codigo.
- **In Progress -> Review**: la implementacion esta terminada y verificada de forma basica (sin errores de compilacion/lint bloqueantes).
- **Review -> Done**: la tarea cumple criterios de aceptacion y se valida su funcionamiento en la app.

## Reglas de trabajo

- Mantener descripciones de tarjetas orientadas a valor de usuario.
- Dividir tareas grandes en subtareas de maximo 1-2 sesiones de trabajo.
- Actualizar estado en Trello el mismo dia para conservar trazabilidad real del avance.
