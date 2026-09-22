# Toko — Crédito Maestro (prototipo de usabilidad)

Prototipo interactivo para pruebas de usabilidad del flujo de solicitud de **Crédito Maestro** (crédito por descuento vía nómina): simula, de principio a fin, cómo un asesor levanta la solicitud de un cliente desde su propio dispositivo.

**Demo en vivo:** [tokopu.vercel.app](https://tokopu.vercel.app)

¿Vas a arrancar un proyecto nuevo parecido a este, o quieres entender cómo se armó? Ve [SETUP.md](./SETUP.md).

## Stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [react-router-dom v6](https://reactrouter.com/)
- CSS plano con tokens de diseño (`src/styles.css`) — sin librería de UI
- Funciones serverless de Vercel (`api/`) para guardar y exportar las sesiones de prueba

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Build de producción:

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  screens/         Pantallas, organizadas por "bloque" del flujo de solicitud
    block1/        Dashboard, nueva solicitud, hub de la solicitud
    block2/        Identificación y autenticación del cliente
    block3/        Cotizador (selección de oferta)
    block4/        Información de la solicitud
    block5/        Documentos y cierre
    moderador/     Pantallas del panel de moderador
  components/      Componentes compartidos (botones, sheets, captura de documentos...)
  domain/          Lógica de negocio pura (cotización, catálogos, validadores)
  state/           Store de la solicitud (Context + useReducer) y caché de archivos (IndexedDB)
  metrics/         Tracking de eventos para el análisis de la prueba
  moderador/       Cliente HTTP hacia las funciones de moderador
api/               Funciones serverless (Vercel): sesiones, exportación, auth de moderador
public/            Assets estáticos (imágenes de muestra para los flujos simulados)
```

## Variables de entorno

Copia `.env.example` y complétalas en Vercel (Settings → Environment Variables):

| Variable | Para qué |
| --- | --- |
| `MOD_KEY` | Clave de acceso al panel de moderador (`/moderador`) |
| `INGEST_TOKEN` / `VITE_INGEST_TOKEN` | Token (no secreto) para guardar sesiones de prueba — deben coincidir |
| `BLOB_READ_WRITE_TOKEN` | Lo genera Vercel al crear un Blob store (Storage → Create → Blob) |

## Despliegue

Cada push a `main` se despliega automáticamente en Vercel.

## Notas

Es un prototipo de investigación, no el producto real: varios flujos (biometría remota, autollenado por OCR, aprobación) están simulados o con datos de demo para poder correr pruebas de usabilidad completas sin depender de un backend real.
