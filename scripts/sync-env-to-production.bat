@echo off
REM ───────────────────────────────────────────────────────
REM Sincroniza configuracoes do Firebase do .env para .env.production
REM ───────────────────────────────────────────────────────
REM Uso:
REM   scripts\sync-env-to-production.bat
REM ───────────────────────────────────────────────────────

setlocal enabledelayedexpansion

echo ===========================================
echo   ^^^> Sync .env -^> .env.production
echo ===========================================
echo.

if not exist .env (
    echo [ERRO] .env nao encontrado
    exit /b 1
)

set "PREFIXES=FIREBASE_ NEXT_PUBLIC_FIREBASE_ MERCADOPAGO_ NEXT_PUBLIC_MERCADOPAGO_ PAGBANK_ ABACATEPAY_ PAYMENT_ NEXT_PUBLIC_BASE_URL"

type nul > .env.production.tmp

for %%p in (%PREFIXES%) do (
    findstr /b /i "%%p" .env >> .env.production.tmp 2>nul
)

REM Remover linhas duplicadas e vazias
sort < .env.production.tmp > .env.production.sorted 2>nul
findstr /v /r "^$" .env.production.sorted > .env.production 2>nul
del .env.production.tmp .env.production.sorted 2>nul

for /f %%c in ('type .env.production ^| find /c /v ""') do set COUNT=%%c

echo [!] %COUNT% variaveis copiadas para .env.production
echo.
echo Variaveis copiadas:
for /f "delims== tokens=1" %%v in (.env.production) do echo    %%v

echo.
echo === Concluido ===
