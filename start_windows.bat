@echo off
chcp 65001 >nul
title Viamed Newsletter Builder

echo ============================================
echo   Viamed Newsletter Builder
echo ============================================
echo.

:: ── 1. Comprobar Python ─────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    echo.
    echo Por favor instala Python desde: https://www.python.org/downloads/
    echo Durante la instalacion marca la casilla "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo [OK] Python %PY_VER% encontrado.

:: ── 2. Comprobar version minima (3.8+) ──────
python -c "import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Se requiere Python 3.8 o superior. Version instalada: %PY_VER%
    echo Descarga una version mas reciente desde: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: ── 3. Crear entorno virtual si no existe ───
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado.
) else (
    echo [OK] Entorno virtual encontrado.
)

:: ── 4. Activar entorno virtual ──────────────
call venv\Scripts\activate.bat

:: ── 5. Instalar / verificar dependencias ────
echo [INFO] Comprobando dependencias...
pip install -r requirements.txt --quiet --disable-pip-version-check
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias.
    echo Comprueba tu conexion a internet e intenta de nuevo.
    echo.
    pause
    exit /b 1
)
echo [OK] Dependencias listas.

:: ── 6. Comprobar que Flask responde ─────────
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flask no se instalo correctamente.
    pause
    exit /b 1
)

:: ── 7. Crear carpeta drafts si no existe ────
if not exist "drafts" mkdir drafts

:: ── 8. Abrir navegador y arrancar Flask ─────
echo.
echo [OK] Todo listo. Iniciando servidor...
echo Abre tu navegador en: http://localhost:5000
echo Para cerrar el programa pulsa Ctrl+C en esta ventana.
echo.

:: Espera 2 segundos y abre el navegador
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:5000"

python app.py

pause
