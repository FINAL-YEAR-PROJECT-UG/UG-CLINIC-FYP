#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting UG Clinic API..."
exec node dist/app.js
