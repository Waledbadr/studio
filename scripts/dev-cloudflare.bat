@echo off
echo Starting EstateCare with Cloudflare Authentication...
echo.

echo 1. Starting Cloudflare Pages Dev Server on port 8788...
start "Cloudflare Dev" cmd /k "npm run wrangler:dev"

echo 2. Waiting for Cloudflare server to start...
timeout /t 5 /nobreak >nul

echo 3. Starting Next.js Development Server...
npm run dev:base

echo.
echo Both servers are running:
echo - Next.js: http://localhost:3000
echo - Cloudflare: http://localhost:8788
echo.
echo Authentication will use Cloudflare D1 Database