#!/bin/bash
export NODE_ENV=production
pm2 restart life-kline-next || pm2 start ecosystem.config.js
