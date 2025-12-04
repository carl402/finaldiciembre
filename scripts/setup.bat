@echo off
echo 🚀 Configurando proyecto Take a Look...

echo.
echo 📦 Instalando dependencias del servidor...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del servidor
    exit /b 1
)

echo.
echo 📦 Instalando dependencias del cliente...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del cliente
    cd ..
    exit /b 1
)
cd ..

echo.
echo 🗄️ Inicializando base de datos...
call npm run db:init
if %errorlevel% neq 0 (
    echo ❌ Error inicializando base de datos
    exit /b 1
)

echo.
echo 🧪 Ejecutando pruebas E2E...
call npm run test:e2e
if %errorlevel% neq 0 (
    echo ⚠️ Algunas pruebas fallaron, pero el sistema puede funcionar
)

echo.
echo ✅ Configuración completada!
echo.
echo 🚀 Para iniciar el desarrollo:
echo    npm run dev
echo.
echo 🌐 Para verificar el estado del sistema:
echo    npm run health-check
echo.
echo 📊 El dashboard estará disponible en: http://localhost:5001