@echo off
echo 🚀 Preparando Take a Look para producción...

cd client

echo 📦 Instalando dependencias...
npm install

echo 🔨 Construyendo proyecto...
npm run build

echo ✅ Build completado!
echo 📁 Archivos listos en: client/dist/

echo.
echo 🌐 Opciones de despliegue:
echo 1. Vercel: vercel --prod
echo 2. Netlify: Subir carpeta dist/ a netlify.com
echo 3. GitHub Pages: npm run deploy

pause