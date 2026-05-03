# Fundamentos de React Native

## React Native vs app nativa

Una app nativa se desarrolla con tecnologias especificas de cada plataforma (Kotlin/Java para Android y Swift/Objective-C para iOS), mientras que React Native permite construir una sola base de codigo en JavaScript/TypeScript para ambas plataformas.

La diferencia clave es que React Native no renderiza HTML dentro de un WebView. Cuando usamos componentes como `View`, `Text` o `Pressable`, React Native crea componentes nativos reales del sistema operativo. Esto permite una experiencia mas cercana al rendimiento y aspecto de una app nativa, manteniendo productividad alta con una base de codigo compartida.

## Que es Metro bundler

Metro es el bundler de React Native. Su funcion principal es:

- Resolver dependencias de la aplicacion.
- Transformar el codigo JavaScript/TypeScript a un bundle ejecutable.
- Aplicar hot reload/fast refresh en desarrollo.
- Servir assets (imagenes, fuentes) durante la ejecucion local.

En el flujo diario, Metro permite iterar rapido: guardas cambios y la app se actualiza casi al instante en el dispositivo o emulador.

## Por que Expo Go no es suficiente en proyectos reales

Expo Go acelera el arranque del proyecto porque evita compilar un binario propio en etapas tempranas. Sin embargo, en proyectos reales tiene limites importantes:

- Solo soporta el conjunto de modulos nativos incluidos por defecto en Expo Go.
- No permite integrar cualquier libreria nativa personalizada.
- No replica al 100% el comportamiento final de la app distribuible.

Por eso, cuando el proyecto necesita modulos nativos avanzados o configuraciones especificas (notificaciones push avanzadas, biometria, integraciones nativas personalizadas), se debe usar **Development Build** con EAS. Ese build genera un binario propio y refleja mejor las condiciones reales de produccion.

## Sistemas de diseno

Para ReadTracker / Scriptorium se elige **React Native Paper** como sistema de diseno principal.

Justificacion:

- Implementa Material Design de forma madura y consistente.
- Acelera desarrollo con componentes listos para formularios, listas, modales y navegacion visual.
- Ofrece theming robusto para personalizar paleta, tipografia y espaciados.
- Mantiene buena integracion con ecosistema React Native y Android.
- Reduce costo de mantenimiento visual frente a crear un sistema UI desde cero.

En el proyecto, `PaperProvider` se integra a nivel raiz para que todos los componentes consuman un tema unificado y escalable.
