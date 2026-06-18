@echo off
REM ───────────────────────────────────────────────────────────
REM Importa dados do Firestore usando as credenciais de producao
REM ───────────────────────────────────────────────────────────
REM Uso:
REM   scripts\import-to-production.bat <arquivo-backup.json> [append|overwrite]
REM
REM Ex:
REM   scripts\import-to-production.bat backup.json append
REM   scripts\import-to-production.bat backup.json overwrite
REM ───────────────────────────────────────────────────────────

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Uso: %~nx0 ^<arquivo.json^> [append^|overwrite]
    echo.
    echo Ex: %~nx0 backup.json append
    exit /b 1
)

set "BACKUP=%1"
set "MODE=%~2"
if "%MODE%"=="" set "MODE=append"

if not exist "%BACKUP%" (
    echo [ERRO] Arquivo nao encontrado: %BACKUP%
    exit /b 1
)

if not exist ".env.production" (
    echo [ERRO] .env.production nao encontrado
    exit /b 1
)

echo ===========================================
echo  Importando para PRODUCAO (.env.production)
echo  Backup: %BACKUP%
echo  Modo:   %MODE%
echo ===========================================
echo.

REM Ler .env.production e definir variaveis
for /f "usebackq delims=" %%a in (".env.production") do (
    set "line=%%a"
    if not "!line!"=="" if not "!line:~0,1!"=="#" (
        set "%%a" 2>nul
    )
)

REM Executar importacao
npx tsx scripts\firestore-import.ts "%BACKUP%" "%MODE%"

if errorlevel 1 (
    echo.
    echo [ERRO] Importacao falhou
    exit /b 1
)

echo.
echo === Concluido ===
