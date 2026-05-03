# Plan breve de pruebas de rendimiento y tema

## Objetivo
Validar que la app mantiene buena fluidez con listas grandes (50+ items) y que el tema claro/oscuro se ve correcto en componentes clave.

## Preparacion
1. Ejecutar la app en simulador/emulador con `npm run android` o `npm run ios`.
2. Activar monitor de rendimiento de React Native (FPS UI/JS) en modo desarrollo.
3. Preparar datos de prueba con al menos:
   - 50 libros en biblioteca.
   - 50 items en wishlist.
   - 50 compras en adquisiciones (si aplica).

## Casos de rendimiento (FPS)
1. Biblioteca (`app/(app)/(tabs)/index.tsx`)
   - Scroll continuo 20-30 segundos en grid.
   - Abrir/cerrar filtros y volver a hacer scroll.
   - Esperado: sin caidas visibles, UI FPS estable y JS FPS sin bloqueos prolongados.
2. Wishlist (`app/(app)/(tabs)/wishlist.tsx`)
   - Buscar mientras se hace scroll.
   - Eliminar varios items seguidos y observar animaciones de salida.
   - Esperado: respuesta inmediata y sin saltos bruscos.
3. Compras (`app/(app)/(tabs)/purchases.tsx`)
   - Scroll vertical completo varias veces.
   - Esperado: animaciones fluidas al cargar/filtrar.

## Alta/edición de libro (opcional)
1. Pantalla nueva/edición con lista de resultados de portadas y scroll.
2. En **web**, escribir en titulo/autor y comprobar que la capitalizacion configurable (`AppInput`) se comporta como en nativo.
3. Esperado: sin tirones al abrir modal de portadas ni al hacer scroll en grid de resultados.

## Casos de tema claro/oscuro
1. Cambiar tema del sistema (claro/oscuro) y relanzar pantalla activa.
2. Revisar contraste en:
   - Titulos de seccion.
   - Inputs, botones, chips y cards.
   - Modales (fondo, texto, acciones).
3. Esperado:
   - Texto legible en todos los fondos.
   - Colores de accion coherentes (primary/error).
   - Sin elementos "invisibles" por contraste.

## Checklist de aceptacion
- [ ] Scroll fluido con 50+ items en biblioteca.
- [ ] Scroll fluido con 50+ items en wishlist.
- [ ] Sin bloqueos al buscar y filtrar.
- [ ] Tema claro correcto en pantallas clave.
- [ ] Tema oscuro correcto en pantallas clave.
- [ ] Animaciones de entrada/salida visibles y sin glitches.

## Nota de entrega
Si se detecta una caida puntual de FPS, registrar:
- Pantalla exacta.
- Accion realizada.
- Cantidad aproximada de items.
- Captura o video corto del momento.
