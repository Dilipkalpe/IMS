# Contabo server — two applications

| Application | URL | Coolify |
|-------------|-----|---------|
| **TMS** | http://tms.144.91.98.218.nip.io/ | Separate TMS project/stack |
| **IMS** | http://ims.144.91.98.218.nip.io/ | IMS Docker Compose (`docker-compose.coolify.yml`) |

Both run on server **144.91.98.218** via Coolify (**http://144.91.98.218:8000/**).

## IMS deploy

See [COOLIFY-SETUP.md](./COOLIFY-SETUP.md).

- Domain on **web** service only: `http://ims.144.91.98.218.nip.io`
- API: same host `/api/*` (proxied by nginx in IMS stack)
- MongoDB: internal to IMS compose (`ims` database)

## TMS

Managed separately — do not change IMS domain to `tms.*`.
