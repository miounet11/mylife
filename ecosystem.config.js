// PM2配置文件
module.exports = {
  apps: [
    {
      name: 'life-kline-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/life-kline-next',
      instances: 'max',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/.pm2/logs/life-kline-next-error.log',
      out_file: '/root/.pm2/logs/life-kline-next-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      restart_delay: 4000,
    },
  ],
};
