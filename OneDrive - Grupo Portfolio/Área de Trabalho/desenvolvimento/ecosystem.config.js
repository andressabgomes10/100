module.exports = {
  apps: [{
    name: 'revenda-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      API_KEY: 'staging_key_456'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      API_KEY: 'NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo',
      CORS_ORIGINS: 'https://nacionalgas.com.br,https://app.minharevenda.com.br',
      GEO_PROVIDER: 'google',
      GEO_API_KEY: 'sua_chave_google_maps'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
