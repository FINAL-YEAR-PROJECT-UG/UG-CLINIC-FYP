#!/bin/sh
set -e

npx prisma migrate deploy --skip-generate 2>&1 | grep -v "^Prisma schema" || true

exec node dist/app.js

