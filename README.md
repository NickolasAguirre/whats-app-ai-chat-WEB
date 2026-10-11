# whatsapp-chat-bot-WEB

Panel de administración del bot de atención por WhatsApp. Angular 22, Tailwind 4, RxJS y signals.

Por ahora trabaja con datos de demostración (adapters mock). Cuando el bot exponga su API admin, se reemplazan los providers en `src/app/app.config.ts`.

## Comandos

```bash
npm install
npm start          # http://localhost:4200
npm test           # Vitest
npm run build      # salida en dist/
```

## Despliegue

Cada push a `main`/`master` ejecuta `.github/workflows/deploy.yml`: tests, build y publicación en GitHub Pages.
Requiere activar Pages en el repo: Settings > Pages > Source: GitHub Actions.
