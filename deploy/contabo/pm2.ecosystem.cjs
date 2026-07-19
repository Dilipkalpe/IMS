/** PM2 process file — run from /var/www/ims/api */
module.exports = {
  apps: [
    {
      name: 'ims-api',
      cwd: '/var/www/ims/api',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
    },
  ],
};
