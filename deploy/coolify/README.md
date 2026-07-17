# Coolify deployment guide — IMS on Contabo
#
# Stack: MongoDB + Node API + React (nginx)
# Coolify panel: http://144.91.98.218:8000/
#
# ## Option A — Three Coolify resources (recommended)
#
# ### 1. MongoDB (Database)
# - Coolify → Project → + New → Database → MongoDB
# - Name: ims-mongo
# - Copy internal connection string, e.g.:
#   mongodb://coolify:PASSWORD@ims-mongo:27017/ims?authSource=admin
#
# ### 2. API (Application)
# - + New → Application → Public Repository (or Git)
# - Repository: your IMS git URL
# - Build Pack: Dockerfile
# - Dockerfile location: /api/Dockerfile
# - Base Directory: /api
# - Port: 3000
# - Environment variables:
#     PORT=3000
#     HOST=0.0.0.0
#     NODE_ENV=production
#     MONGODB_URI=<from step 1>
#     IMS_AUTH_SECRET=<openssl rand -hex 32>
# - Health check path: /api/health
# - Assign domain e.g. api.yourdomain.com OR use Coolify path routing
#
# ### 3. Web (Application)
# - + New → Application
# - Dockerfile location: /ims-web/Dockerfile
# - Base Directory: /ims-web (build context = repo root if Dockerfile copies deploy/)
# - Port: 80
# - Environment (build args if needed):
#     VITE_API_BASE_URL=https://api.yourdomain.com
#   OR leave empty and put nginx reverse proxy in front (see nginx-full.conf)
#
# ## Option B — Docker Compose (single Coolify compose app)
# Use docker-compose.coolify.yml from this folder.
#
# ## After deploy
# - Seed (one-time, API container shell):
#     node src/seed.js
#     node scripts/set-admin-password.js
# - Login: admin / admin
#
# ## WPF desktop
# ApiBaseUrl in settings.json → https://api.yourdomain.com
