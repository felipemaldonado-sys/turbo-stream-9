# Turbo Stream — visor + admin (Next.js)

Aplicación **Next.js 15** con:

| Ruta | Descripción |
|------|-------------|
| **`/`** | Landing con enlaces |
| **`/viewer`** | Visor público (cámaras activas, reproductor HLS / iframe / Twitch SDK) |
| **`/admin`** | Panel CRUD de cámaras (no enlazado desde el visor) |
| **`/live`** → `/viewer` | Redirección |
| **`/configure`** → `/admin` | Redirección |

## Requisitos

- **Node.js 20+** (recomendado: usar `.nvmrc` → `nvm use`)
- npm

## Local

```bash
npm install
npm run dev
```

- [http://localhost:3000/viewer](http://localhost:3000/viewer)
- [http://localhost:3000/admin](http://localhost:3000/admin)

### Vista previa dentro de Cursor

1. Arranca el servidor (una de estas):
   - Terminal integrada: `npm run dev`
   - **Terminal → Run Task…** → **dev: servidor Next.js**
   - **Run and Debug** (panel lateral) → elige **Next.js: npm run dev** y ▶️ (puede abrir el navegador del sistema cuando vea “Local: http://…”)
2. Cuando salga **“Ready”** y la URL `http://localhost:3000`, abre el visor embebido:
   - **Command Palette** (`Cmd+Shift+P` en Mac) → escribe **Simple Browser: Show**
   - Pega: `http://localhost:3000/viewer` (o `/admin`)
3. Opcional: en la vista **Ports** (puertos), si aparece el **3000**, suele haber enlace para abrir en el navegador.

> El “Simple Browser” es el visor web **dentro del editor** (como VS Code). Si no aparece el comando, actualiza Cursor o instala el complemento **Simple Browser** de Microsoft.

Si algo no carga, borra caché y reintenta:

```bash
rm -rf .next
npm run dev
```

## GitHub + Vercel (recomendado)

1. Crea un repositorio en GitHub y sube este proyecto (`git push`).
2. En [Vercel](https://vercel.com) → **Add New Project** → **Import** el repo.
3. Deja **Framework Preset: Next.js**, **Root Directory** en la raíz del repo, **Build Command** `npm run build`, **Output** por defecto.
4. Deploy. La URL será algo como `https://TU-PROYECTO.vercel.app`.

**Importante:** no subas `.env.local` (está en `.gitignore`). Las variables opcionas las defines en Vercel → **Settings → Environment Variables** (ver `.env.example`).

### Variables útiles (opcionales)

| Variable | Uso |
|----------|-----|
| `MEDIA_RTMP_PUBLIC_URL` / `MEDIA_HLS_PUBLIC_BASE_URL` | Relay RTMP→HLS (`npm run media-server` en otro servidor) |
| `NEXT_PUBLIC_TWITCH_EMBED_EXTRA_PARENTS` | Dominios extra para el embed de Twitch (coma separada) |
| `TWITCH_EMBED_EXTRA_PARENTS` | Lo mismo en servidor si hiciera falta |

Tras cambiar variables en Vercel, haz **Redeploy**.

### Datos en Vercel

El almacén por defecto usa JSON (`data/cameras.seed.json` en el repo si no hay `cameras.json` local). En serverless **los cambios del admin no persisten** de forma fiable; para producción conviene una base de datos.

## Otros comandos

```bash
npm run lint       # ESLint
npm run build      # Build de producción
npm run start      # Servir build local (puerto 3000)
npm run media-server  # RTMP+HLS (requiere ffmpeg; aparte de Vercel)
```

## Prototipo estático (referencia)

En la raíz hay `index.html`, `styles.css`, `script.js` como referencia visual / Twitch embebido; la app real es la de **`src/`**.

## CI

En cada push a `main`/`master` se ejecuta **lint + build** (`.github/workflows/ci.yml`).
