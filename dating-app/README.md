# Quedamos Hoy — Aplicación de citas

Este repositorio contiene una aplicación web de citas construida con **Next.js 13 (App Router)** y **Supabase**. Permite a los usuarios crear perfiles, descubrir personas, dar like o pasar, hacer [...] 

## Características principales

- **Autenticación con Supabase** mediante enlace mágico de correo electrónico.
- **Perfiles de usuario** con foto, bio, preferencias de edad y distancia, y ubicación geográfica.
- **Swipe (like y pass)**, detección de **match** y chat 1:1.
- **Rewind diario** para deshacer la última acción (limitado a 1 por día para cuentas premium).
- **Suscripciones premium** mediante **Stripe** con precios configurables.
- **Solicitudes de verificación** y panel de administración para aprobar/rechazar.
- **Políticas y términos de uso** incluidos.

## Requisitos previos

- Node.js 18 o superior.
- Una cuenta de [Supabase](https://supabase.com/).
- Una cuenta de [Stripe](https://stripe.com/) (puede ser en modo test).

## Configuración

1. **Clonar el repositorio**

   ```bash
   git clone <este-repo> quedamos-hoy
   cd quedamos-hoy/dating-app
   ```

2. **Ver una demo sin dependencias (opcional)**

   Si tu proxy bloquea el registro de npm, puedes confirmar que el entorno sirve contenido con una página estática que no necesita instalar paquetes:

   ```bash
   npm run demo
   ```

   Abre http://localhost:3000 en tu navegador. Cuando tengas acceso al registro de npm, detén el servidor demo y sigue con la instalación completa.

3. **Instalar dependencias**

   Usa el script incluido para limpiar la configuración de proxies que devuelven 403 y apuntar al registro público de npm:

   ```bash
   ./scripts/install-deps.sh
   ```

   Si necesitas forzar un proxy autenticado, configura previamente `HTTP_PROXY`/`HTTPS_PROXY` y, si es necesario, elimina las líneas de borrado de proxy en el script.

4. **Crear proyecto en Supabase**

   - Crea un nuevo proyecto en Supabase.
   - Copia el valor de `Project URL` y la `anon public key`.
   - Copia la `service_role key` (se usará en el backend para el webhook y API internas).
   - En la sección **SQL Editor**, ejecuta el contenido de `db/schema.sql` para crear todas las tablas, funciones y políticas.
   - Asegúrate de habilitar el esquema `public` en la sección **Realtime** para la tabla `messages` si deseas chat en tiempo real.

5. **Configurar Stripe**

   - Crea una cuenta en Stripe (puede ser de test).
   - Crea un producto y un precio recurrente (mensual) en el panel de Stripe y copia el ID del precio (`price_...`).
   - Obtén tu `STRIPE_SECRET_KEY` en **Developers → API keys**.
   - Instala la [Stripe CLI](https://stripe.com/docs/stripe-cli) para probar webhooks en local (opcional pero recomendado).
   - Para recibir webhooks en local, ejecuta:

     ```bash
     stripe login
     stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted --forward-to localhost:3000/api/stripe/webhook
     ```

     La CLI mostrará un `Signing secret` (`whsec_...`) que debes configurar como `STRIPE_WEBHOOK_SECRET`.

6. **Variables de entorno**

   Copia `.env.example` a `.env.local` y completa los valores:

   ```ini
   NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   NEXT_PUBLIC_ADMIN_EMAILS=admin@tudominio.com
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_MONTHLY_PRICE_ID=price_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

7. **Iniciar la aplicación**

   ```bash
   npm run dev
   ```

   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Uso

- Visita `/login` para iniciar sesión con tu correo electrónico. Recibirás un enlace mágico en tu correo (en modo local, Supabase no envía correos; puedes ir a la consola de Supabase → Auth[...]
- Completa tu perfil en `/profile`, establece tus preferencias y solicita la verificación si lo deseas.
- Descubre perfiles en `/dashboard`, da like o pasa. Cuando haya match, podrás chatear desde el aviso que aparece o navegando manualmente a `/chat/[matchId]`.
- Suscríbete a Premium para obtener rewinds adicionales y ver quién te dio like.
- Como administrador (correos definidos en `NEXT_PUBLIC_ADMIN_EMAILS`), accede a `/admin` para revisar solicitudes de verificación.

## Notas

- Esta aplicación utiliza políticas de **Row Level Security** en Supabase. Asegúrate de que RLS esté activado y de que las políticas se hayan creado correctamente mediante el script SQL.
- El chat actualmente utiliza sondeos periódicos cada 5 segundos para obtener nuevos mensajes. Puedes mejorar esto utilizando la API de realtime de Supabase.
- Para filtros de distancia, es necesario que los usuarios actualicen su ubicación desde la página de perfil. Esto utiliza la API `navigator.geolocation` del navegador.

## Próximos pasos sugeridos

- Añadir carga de imágenes a Supabase Storage en lugar de requerir URLs externas.
- Mejorar el algoritmo de recomendación de perfiles.
- Implementar notificaciones push y mejor experiencia de chat en tiempo real.
- Añadir moderación automática de contenidos e imágenes.

¡Disfruta construyendo y lanzando tu propia app de citas con Quedamos Hoy!