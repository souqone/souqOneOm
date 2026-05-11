# Branch Protection Setup — GitHub

## خطوات التفعيل

1. **اذهب إلى**: `github.com/Mahmoud997s/SouqOne/settings/branches`
2. **اضغط** "Add branch protection rule"
3. **Branch name pattern**: `main`

## الإعدادات المطلوبة

| الإعداد | القيمة |
|---------|--------|
| **Require a pull request before merging** | ✅ ON |
| — Required approvals | 1 |
| **Require status checks to pass** | ✅ ON |
| — Status checks required | `CI ✓` |
| **Require branches to be up to date** | ✅ ON |
| **Block direct push** | ✅ ON (automatic with PR requirement) |
| **Do not allow force pushes** | ✅ ON |
| **Do not allow deletions** | ✅ ON |

## Secrets المطلوبة (Repository Settings → Secrets)

| Secret | الوصف | مثال |
|--------|-------|------|
| `RAILWAY_DEPLOY_HOOK_API` | Railway deploy webhook URL for API service | `https://railway.app/api/deploy/...` |
| `RAILWAY_DEPLOY_HOOK_WEB` | Railway deploy webhook URL for Web service | `https://railway.app/api/deploy/...` |
| `PROD_API_URL` | Production API base URL | `https://caroneapi-production.up.railway.app` |
| `PROD_WEB_URL` | Production Web base URL | `https://souqone.com` |

## كيف تحصل على Railway Deploy Hooks

1. افتح **Railway Dashboard** → اختر المشروع
2. اختر **API Service** → Settings → Deploy → **Deploy Hooks**
3. اضغط **Generate** → انسخ الـ URL
4. ضعه في GitHub Secrets كـ `RAILWAY_DEPLOY_HOOK_API`
5. كرر لـ **Web Service** → `RAILWAY_DEPLOY_HOOK_WEB`

## الـ Pipeline Flow بعد التفعيل

```
feature branch → PR → CI/CD Pipeline:
  ├── Quality (lint + typecheck + build)
  ├── Security Audit
  ├── API Unit Tests
  ├── API E2E Tests (17 suites)
  ├── Web E2E Tests (Playwright)
  └── Gate: CI ✓
        └── Deploy (main only):
              ├── Trigger Railway API deploy
              ├── Trigger Railway Web deploy
              ├── Health check API
              └── Health check Web
```
