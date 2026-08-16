# FICE Medical Client Portal

SPA Vue 3 + Quasar 2 para el Client Portal. El backend es `fice-medical-api` (`/portal/v1`).

## Desarrollo local

1. API en `http://localhost:8080`
2. Copiar `.env.example` a `.env`
3. `npm install`
4. `npm run dev` (puerto **8091**)

### Tenant en local

- Host recomendado: `http://portal.{domain}.localhost:8091`  
  Ejemplo: `http://portal.pruebas.localhost:8091`
- Fallback: `http://localhost:8091?domain=pruebas` envía `X-Tenant-Key` (solo localhost)

El access token vive en memoria. El refresh token se guarda en `sessionStorage` (Fase 1).

## Rutas

| Ruta | Uso |
|---|---|
| `/login` | Inicio de sesión |
| `/register` | Autoregistro |
| `/verify-email?t=` | Activación |
| `/invitation?t=` | Aceptar invitación de staff |
| `/forgot-password` | Pedir reset |
| `/reset-password?t=` | Confirmar reset |
| `/dashboard` | Inicio autenticado |
| `/profile` | Perfil |

Citas, documentos, consentimientos, formularios, mensajes y MFA quedan para fases posteriores.

## GitHub Pages

El workflow `.github/workflows/deploy.yml` publica `dist/spa` en `docs/` al hacer push (o merge de PR) a `main`.

1. En el repo: **Settings → Pages → Branch `main` / folder `/docs`**
2. Variable de Actions: `VITE_API_BASE_URL` = URL pública de la API (sin slash final)
3. CORS de la API debe permitir `https://<user>.github.io`

