# Idea del proyecto: ReadTracker (Scriptorium)

## Problema que resuelve

Muchos lectores anotan ideas, progreso y pendientes en apps distintas (notas, listas de deseos, historial), lo que fragmenta su flujo y dificulta mantener el habito de lectura. ReadTracker centraliza en una sola app el registro de lecturas, la gestion de libros pendientes y el seguimiento del progreso para que el usuario tenga trazabilidad completa de su vida lectora (app nativa **y** web Expo contra la misma API).

## Usuario objetivo y uso en el dia a dia

El usuario objetivo es una persona que lee con frecuencia (estudiantes, profesionales y lectores habituales) y quiere organizar su lectura desde el movil de forma rapida.

Uso diario esperado:

- Por la manana o durante el dia, anade libros que quiere leer a su wishlist.
- Cuando comienza una sesion, registra progreso por paginas.
- Al terminar una sesion, revisa historial y estadisticas para mantener motivacion.
- Cuando compra un libro, lo marca como adquirido para mantener limpia su lista de deseos.

## Funcionalidades principales (MVP)

- Autenticacion con **Firebase Auth** (email/contrasena); la API valida **ID tokens** con Firebase Admin.
- Biblioteca personal: listado (paginado), busqueda, filtros y vista de detalle; alta y edicion de libro.
- Portadas: **busqueda online** via API (`GET /covers/search`, Open Library + Google Books en servidor); **subida opcional** a **AWS S3** con URL firmada tras autenticacion Firebase.
- **ISBN:** escaneo o entrada manual al dar de alta un libro; metadatos desde APIs publicas + enriquecimiento opcional con IA en servidor (Groq) y traduccion en cliente.
- Registro de sesiones de lectura y actualizacion de progreso.
- Historial de lectura por fechas/sesiones.
- Wishlist con creacion, edicion, eliminacion y marcado como comprado.
- Estadisticas basicas de lectura (sesiones, paginas, rachas, promedios).
- Modelo **Scriptorium Pro**: prueba gratuita + pago unico con **Stripe** (Payment Intent + webhook) para desbloquear la app de forma permanente para esa cuenta.

## Funcionalidades opcionales (futuras)

- Notificaciones inteligentes para recordar sesiones de lectura.
- Objetivos personalizados (paginas por semana, libros por mes).
- Recomendaciones de libros basadas en historial.
- Sincronizacion multi-dispositivo con modo offline-first.
- Exportacion de reportes de lectura (PDF/CSV).
- Mas fuentes de catalogo y recomendaciones automaticas mas alla del flujo ISBN actual.
