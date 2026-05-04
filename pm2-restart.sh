#!/bin/bash
set -euo pipefail

export NODE_ENV=production
export ENABLE_BACKGROUND_WORKERS="${ENABLE_BACKGROUND_WORKERS:-1}"

pm2 startOrReload ecosystem.config.js
pm2 status
