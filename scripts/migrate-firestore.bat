@echo off
REM ───────────────────────────────────────────────────────
REM Migra dados do Firestore entre projetos (.env → .env.production)
REM ───────────────────────────────────────────────────────
REM Uso:
REM   scripts\migrate-firestore.bat
REM ───────────────────────────────────────────────────────

setlocal enabledelayedexpansion

echo ===========================================
echo   ^>^> Migracao Firestore
echo ===========================================
echo.

if not exist .env (
    echo [ERRO] .env nao encontrado
    exit /b 1
)

REM Gerar nome do arquivo de backup
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_FILE=%CD%\backup-migration-%datetime:~0,8%-%datetime:~8,6%.json

REM ─── Passo 1: Exportar ────────────────────────────
echo [1/2] Exportando do projeto ORIGEM (.env)...
echo.

REM Carregar .env e exportar
for /f "tokens=*" %%a in (.env) do set %%a 2>nul
npx tsx scripts\firestore-export.ts "%BACKUP_FILE%"

echo.

REM ─── Passo 2: Importar ────────────────────────────
if not exist .env.production (
    echo.
    echo [AVISO] .env.production nao encontrado.
    echo Backup salvo em: %BACKUP_FILE%
    echo Para importar manualmente: npm run firestore:import %BACKUP_FILE%
    echo.
    exit /b 0
)

echo [2/2] Importando para projeto DESTINO (.env.production)...
echo.

REM Carregar .env.production e importar
for /f "tokens=*" %%a in (.env.production) do set %%a 2>nul
npx tsx scripts\firestore-import.ts "%BACKUP_FILE%" append

echo.
echo ===========================================
echo   Migracao concluida!
echo   Backup: %BACKUP_FILE%
echo ===========================================
