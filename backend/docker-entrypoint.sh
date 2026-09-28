#!/bin/sh
set -e

npx prisma migrate deploy --skip-generate >/dev/null 2>&1

exec node dist/app.js

