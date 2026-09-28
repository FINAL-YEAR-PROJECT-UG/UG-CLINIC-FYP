#!/bin/sh
set -e

npx prisma migrate deploy --skip-generate

exec node dist/app.js

