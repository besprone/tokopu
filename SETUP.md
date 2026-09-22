# Guía: cómo construir un prototipo como Toko desde cero

Esta guía explica, paso a paso, qué se necesita y cómo se arma un proyecto como **Toko** (prototipo de usabilidad en React + Vite, desplegado en Vercel, con backend serverless ligero). Sirve tanto para que otra persona arranque un proyecto nuevo parecido, como para que tú mismo tengas el checklist a la mano la próxima vez.

## 1. Cuentas necesarias (una sola vez)

| Cuenta | Para qué | Costo |
| --- | --- | --- |
| GitHub | Guardar el código y su historial (control de versiones) | Gratis |
| Vercel | Desplegar la app automáticamente en internet cada vez que se sube código | Gratis (plan Hobby) |
| Claude Code (u otra IA de código) | El asistente que escribe/edita el código contigo | Requiere suscripción |

Paso importante: conecta tu cuenta de **Vercel con tu cuenta de GitHub** (Vercel te lo pide al crear un proyecto nuevo — "Continue with GitHub"). Así, cada `git push` a la rama principal despliega solo, sin que tengas que hacer nada manual.

## 2. Herramientas en tu computadora

- **Node.js** (versión 18 o más nueva) — es lo que corre React/Vite localmente. Se instala desde nodejs.org.
- **Git** — casi siempre ya viene instalado en Mac; en Windows se instala desde git-scm.com.
- **Claude Code** (`npm install -g @anthropic-ai/claude-code` o la app de escritorio) — para trabajar con la IA directo en tu proyecto.
- Un editor de código (opcional) — por ejemplo VS Code, para dar un vistazo rápido.

## 3. Arrancar el proyecto desde cero (bootstrap)

Estos son los pasos técnicos que se siguieron para levantar Toko; sirven igual para cualquier prototipo nuevo de este tipo.

### 3.1 Crear el proyecto de React + Vite

```bash
npm create vite@latest mi-prototipo -- --template react
cd mi-prototipo
npm install
```

### 3.2 Instalar lo esencial

```bash
npm install react-router-dom
```

Toko también usa `@vercel/blob` para guardar archivos de sesiones de prueba — solo hace falta si tu prototipo necesita guardar algo en un backend.

### 3.3 Iniciar git y subir a GitHub

```bash
git init
git add -A
git commit -m "Primer commit: scaffold de Vite + React"
```

Luego en GitHub: crear un repositorio nuevo (vacío, sin README) y conectarlo:

```bash
git remote add origin https://github.com/tu-usuario/mi-prototipo.git
git branch -M main
git push -u origin main
```

### 3.4 Conectar con Vercel

1. Entra a vercel.com → "Add New" → "Project".
2. Importa el repositorio de GitHub que acabas de crear.
3. Vercel detecta que es un proyecto Vite automáticamente (build command `vite build`, output `dist`) — no hay que tocar nada.
4. Dale "Deploy". A partir de aquí, cada `git push` a `main` despliega solo.

### 3.5 Variables de entorno (si el proyecto las necesita)

Si tu prototipo va a tener alguna función de backend (login de moderador, guardar sesiones, etc.):

1. Crea un archivo `.env.example` en el repo con los nombres de las variables (sin valores reales) — sirve de documentación para quien clone el proyecto.
2. Agrega `.env` y `.env.*` a `.gitignore` (con excepción de `.env.example`) — los valores reales nunca se suben al repo.
3. Los valores reales se configuran solo en Vercel: Project → Settings → Environment Variables.

Esto es exactamente lo que hace Toko con `MOD_KEY`, `INGEST_TOKEN`/`VITE_INGEST_TOKEN` y `BLOB_READ_WRITE_TOKEN` — puedes ver el patrón completo en su `.env.example` y `.gitignore`.

## 4. Cómo está armado Toko por dentro

Esta parte es específica del proyecto, para entender las decisiones ya tomadas:

- **src/screens/** — las pantallas, organizadas por "bloque" del flujo (block1 a block5), más una carpeta moderador/ aparte.
- **src/components/** — piezas de UI reutilizables (sistema de botones, sheets, captura de documentos).
- **src/domain/** — lógica de negocio pura, sin nada de UI (cotización de crédito, catálogos, validadores) — así se puede probar/leer sin pensar en pantallas.
- **src/state/** — el estado global de la solicitud (Context + useReducer, guardado en localStorage) y un caché de archivos en IndexedDB para las fotos/PDFs capturados.
- **src/metrics/** — el tracking de eventos para poder analizar después cómo le fue a cada persona en la prueba de usabilidad.
- **api/** — funciones serverless de Vercel (no es un servidor aparte; cada archivo en api/ es un endpoint) para guardar sesiones, exportarlas y el login del moderador.

## 5. El flujo de trabajo día a día

Así se ha trabajado en Toko, turno a turno con la IA:

1. Describir el cambio o bug en lenguaje natural ("el botón X debería hacer Y", "se ve mal en iOS").
2. La IA lee el código relevante primero, explica su diagnóstico antes de tocar nada si el tema no es obvio.
3. Se implementa el cambio y se corre `npm run build` para asegurar que compila sin errores.
4. Se verifica en un navegador (o en el simulador de iOS si aplica) antes de dar el cambio por bueno.
5. Se hace commit con un mensaje descriptivo (qué cambió y por qué, no solo qué).
6. Se pregunta antes de hacer push — nunca se sube a producción sin confirmar.
7. Vercel despliega solo; se puede volver a verificar ya en la URL pública.

Nota sobre el repo: en Toko se trabaja directo sobre `main`, sin ramas por feature ni pull requests — es una decisión válida para un prototipo con un equipo chico, pero si más personas empiezan a subir cambios a la vez, vale la pena considerar ramas + PRs para revisar antes de mezclar.

## 6. Checklist rápido para un proyecto nuevo

- [ ] Cuenta de GitHub y de Vercel (conectadas entre sí)
- [ ] Node.js instalado localmente
- [ ] `npm create vite@latest` con el template de React
- [ ] Repo en GitHub + primer push
- [ ] Proyecto importado en Vercel (deploy automático funcionando)
- [ ] `.env.example` + `.gitignore` si hay backend/secretos
- [ ] Variables de entorno reales cargadas solo en Vercel, nunca en el repo
- [ ] Si alguien más va a subir cambios: agregarlo como colaborador del repo en GitHub (Settings → Collaborators) con permiso de escritura
