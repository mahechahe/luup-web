# Luup Web — Panel de Administración

Aplicación web interna para la gestión operativa de eventos de reciclaje y logística de colaboradores de **Luup**.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 |
| Build tool | Vite 7 + SWC |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui (new-york, JSX, neutral) |
| Routing | React Router v7 |
| Estado global | Zustand |
| Formularios | React Hook Form + Yup |
| HTTP | Axios |
| Mapas | Mapbox GL JS v3 + Mapbox Draw |
| PWA | vite-plugin-pwa + Workbox |
| Tipografía | Roboto (via `@fontsource/roboto`) |

---

## Requisitos previos

- Node.js ≥ 18
- npm ≥ 9

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Scripts disponibles

```bash
npm run dev                  # Servidor de desarrollo (Vite HMR)
npm run build                # Build de producción
npm run preview              # Preview del build de producción
npm run lint                 # Linter (ESLint + Airbnb config)
npm run generate-pwa-assets  # Regenerar iconos PWA desde public/logo.svg
```

---

## Estructura del proyecto

```
src/
├── App/
│   ├── auth/                    # Contexto de autenticación y servicios JWT
│   ├── context/                 # Stores de Zustand (userStore, etc.)
│   ├── routes/                  # Páginas y módulos de la app
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Colaboradores/       # Gestión y detalle de colaboradores
│   │   ├── Eventos/             # Módulo completo de eventos
│   │   │   ├── Canvas/          # Editor visual de zonas (canvas)
│   │   │   ├── MapLayout/       # Mapa en tiempo real con Mapbox
│   │   │   ├── Zonas/           # Gestión de zonas por evento
│   │   │   └── Checkin/         # Check-in / check-out de colaboradores
│   │   ├── Inventario/          # Gestión de inventario
│   │   └── Zonas/               # Zonas de acopio globales
│   └── utils/
│       └── constants/           # apiConstants.js (BASE_URL, ENDPOINTS)
├── components/
│   └── ui/                      # Componentes shadcn/ui (no editar a mano)
├── lib/
│   └── utils.js                 # cn() — clsx + tailwind-merge
└── index.css                    # Tokens CSS + tema Tailwind (@theme inline)
```

---

## Módulos principales

### Colaboradores
- Listado paginado con filtros (nombre, cédula, email, teléfono, género, estado)
- Creación, edición y eliminación de colaboradores
- Carga masiva vía Excel
- Vista de detalle con información personal, salud, contacto de emergencia, datos bancarios y experiencia laboral
- **Historial de eventos** del colaborador con asistencia, horarios e incidencias
- **Modal de movimientos**: visualiza la ruta GPS del colaborador durante un evento sobre Mapbox (`dark-v11`), con línea de trayectoria, marcadores de inicio/fin y estadísticas de batería

### Eventos
- Listado y creación de eventos
- **Canvas**: editor de zonas sobre mapa (dibujo de polígonos con Mapbox Draw, asignación de personas por rol)
- **Map Layout**: vista en tiempo real de ubicaciones de colaboradores sobre el mapa, con polling cada 30 s, alertas de batería baja y sin reporte, y auto-zoom a las zonas al cargar
- **Zonas**: gestión de zonas por evento, asignación de roles (coordinador, supervisor, responsable de acopio, colaboradores), registro de residuos e incidencias
- **Check-in**: registro de asistencia por estaciones, gestión de inventario en campo y control de salida

### Inventario
- Listado de ítems con filtros
- Creación, edición y eliminación de ítems

---

## Rutas de la aplicación

| Ruta | Módulo |
|---|---|
| `/iniciar-sesion` | Login |
| `/dashboard` | Dashboard principal |
| `/colaboradores` | Listado de colaboradores |
| `/colaboradores/:id` | Detalle del colaborador |
| `/eventos/listado` | Listado de eventos |
| `/eventos/mis-eventos` | Eventos del worker |
| `/eventos/:id` | Módulos del evento |
| `/eventos/:id/canvas` | Editor de zonas (canvas) |
| `/eventos/:id/map-layout` | Mapa en tiempo real |
| `/eventos/:id/zonas` | Gestión de zonas |
| `/eventos/:id/checkin` | Check-in / check-out |
| `/inventario` | Gestión de inventario |

---

## Identidad visual

| Token | Color | Uso |
|---|---|---|
| `--color-luup-blue-dark` | `#234465` | Primary / sidebar / foreground |
| `--color-luup-blue-light` | `#7493B2` | Accent sutil |
| `--color-brand` | `#DD7419` | CTA, highlights, naranja acento |
| `--background` | `#E9E2CF` | Fondo principal (crema) |

Todos los tokens están definidos en `src/index.css` dentro del bloque `@theme inline {}`. No existe `tailwind.config.js`.

---

## Agregar componentes shadcn/ui

```bash
npx shadcn@latest add <component-name>
```

Los componentes se generan en `src/components/ui/`. **No editar estos archivos a mano** — volver a ejecutar el comando para actualizarlos.

---

## PWA

La app está configurada como PWA (modo `generateSW` + Workbox). Para regenerar los iconos tras cambiar `public/logo.svg`:

```bash
npm run generate-pwa-assets
```

Iconos requeridos en `public/`: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`.

---

## Configuración de la API

La URL base se configura en `src/App/utils/constants/apiConstants.js`:

```js
BASE_URL: 'http://localhost:3000/api/v1'  // desarrollo
// BASE_URL: '/api/v1'                    // producción (proxy o mismo origen)
```

---

## Despliegue en producción

El proceso de deploy es manual vía **FileZilla** + SSH al servidor donde Nginx sirve la app.

### Paso 1 — Generar el build

```bash
npm run build
```

Esto genera la carpeta `dist/` en la raíz del proyecto.

### Paso 2 — Comprimir el dist

Comprimir **el contenido** de `dist/` (no la carpeta en sí) en un archivo `dist.zip`.

> En Windows: seleccionar todo lo que hay dentro de `dist/` → clic derecho → _Comprimir en archivo ZIP_ → renombrar a `dist.zip`.

### Paso 3 — Subir el ZIP con FileZilla

1. Abrir FileZilla y conectarse al servidor.
2. Navegar en el panel remoto hasta el directorio del servidor (por ejemplo `/var/www/web_luup/` o la ruta que corresponda).
3. Arrastrar `dist.zip` desde el panel local al panel remoto.

### Paso 4 — Verificar que el archivo subió correctamente

Antes de desplegar, confirmar que el ZIP es el correcto revisando su fecha y peso:

```bash
ls -lh dist.zip
```

Esto muestra el tamaño y la hora de modificación del archivo. Si la fecha y hora coinciden con la subida reciente, se puede continuar con el despliegue.

### Paso 5 — Limpiar y desplegar en el servidor (SSH)

Conectarse al servidor por SSH y ejecutar:

```bash
# 1. Limpiar el contenido anterior
sudo rm -rf /var/www/web_luup/*

# 2. Descomprimir el nuevo build
sudo unzip -o dist.zip -d /var/www/web_luup
```

La app queda activa de inmediato. No es necesario reiniciar Nginx salvo que cambie su configuración.

---

## Convenciones

- **Alias de importación**: usar `@/` para todo import interno (mapeado a `./src`)
- **Estilos**: solo clases Tailwind; sin CSS inline salvo casos puntuales de Mapbox
- **Servicios**: cada módulo tiene su carpeta `services/` con funciones que retornan `{ status, data, errors }`
- **Rutas**: definidas en `src/App/routes/routesConfig.js` con lazy loading
- **Componentes UI**: generados por shadcn, no editar manualmente
