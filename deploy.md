# 🚀 Guía de Despliegue - Take a Look

## Opción 1: Vercel (Recomendado)

### Pasos:
1. Instalar Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Ir a la carpeta client:
   ```bash
   cd client
   ```

3. Construir el proyecto:
   ```bash
   npm run build
   ```

4. Desplegar:
   ```bash
   vercel
   ```

5. Seguir las instrucciones:
   - ¿Configurar y desplegar? → Y
   - ¿En qué scope? → tu-usuario
   - ¿Enlazar proyecto existente? → N
   - ¿Nombre del proyecto? → take-a-look
   - ¿En qué directorio está el código? → ./
   - ¿Detectar configuración automáticamente? → Y
   - ¿Sobrescribir configuración? → N

## Opción 2: Netlify

### Pasos:
1. Construir el proyecto:
   ```bash
   cd client
   npm run build
   ```

2. Ir a [netlify.com](https://netlify.com)
3. Arrastrar la carpeta `dist` al área de deploy
4. ¡Listo!

## Opción 3: GitHub Pages

### Pasos:
1. Subir código a GitHub
2. Instalar gh-pages:
   ```bash
   cd client
   npm install --save-dev gh-pages
   ```

3. Agregar al package.json:
   ```json
   "homepage": "https://tu-usuario.github.io/take-a-look",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Desplegar:
   ```bash
   npm run deploy
   ```

## 📝 Notas Importantes

- El sistema usa localStorage, por lo que los datos se guardan localmente en cada navegador
- Las credenciales de prueba son: admin@test.com / admin123
- El sistema es completamente frontend, no requiere servidor backend
- Todas las funcionalidades están simuladas para demostración

## 🔗 URLs de Ejemplo

Después del despliegue tendrás URLs como:
- Vercel: `https://take-a-look-xyz.vercel.app`
- Netlify: `https://take-a-look-xyz.netlify.app`
- GitHub Pages: `https://tu-usuario.github.io/take-a-look`