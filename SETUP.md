# Take a Look - Guía de Configuración

## 🚀 Configuración Rápida

### 1. Prerrequisitos
- Node.js 18+ instalado
- Base de datos PostgreSQL (recomendado: Neon)
- Git

### 2. Configuración Inicial

```bash
# Clonar y navegar al proyecto
cd take-a-look-main

# Ejecutar configuración automática
scripts\setup.bat
```

### 3. Configuración Manual (si es necesario)

#### Paso 1: Variables de Entorno
```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env con tus credenciales de base de datos
```

#### Paso 2: Instalar Dependencias
```bash
# Dependencias del servidor
npm install

# Dependencias del cliente
cd client
npm install
cd ..
```

#### Paso 3: Inicializar Base de Datos
```bash
npm run db:init
```

#### Paso 4: Ejecutar Pruebas
```bash
npm run test:e2e
```

## 🏃‍♂️ Ejecutar el Sistema

### Desarrollo (Servidor + Cliente)
```bash
npm run dev
```

### Solo Servidor
```bash
npm run dev:server
```

### Solo Cliente
```bash
npm run dev:client
```

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor y cliente en modo desarrollo |
| `npm run build` | Construye el proyecto para producción |
| `npm run start` | Inicia el servidor en modo producción |
| `npm run db:init` | Inicializa la base de datos |
| `npm run test:e2e` | Ejecuta pruebas end-to-end |
| `npm run health-check` | Verifica el estado del sistema |

## 🌐 URLs del Sistema

- **Dashboard Principal**: http://localhost:5001
- **API Health Check**: http://localhost:5001/health
- **API Base**: http://localhost:5001/api

## 🗄️ Estructura de Base de Datos

El sistema crea automáticamente las siguientes tablas:

- `users` - Usuarios del sistema
- `logs` - Archivos de log subidos
- `errors` - Errores detectados en los logs
- `notifications` - Notificaciones del sistema
- `projects` - Proyectos de simulación
- `simulations` - Configuraciones de simulación
- `scenarios` - Escenarios de Monte Carlo
- `simulation_reports` - Reportes generados
- `sessions` - Sesiones de usuario

## 🧪 Pruebas E2E

Las pruebas verifican:

✅ Conexión a base de datos  
✅ Operaciones de usuario  
✅ Procesamiento de logs  
✅ Proyectos y simulaciones  
✅ Sistema de notificaciones  
✅ Estadísticas del dashboard  

## 🔍 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar variables de entorno
echo %DATABASE_URL%

# Probar conexión
npm run db:init
```

### Puerto en Uso
```bash
# Cambiar puerto en .env
PORT=5002
```

### Dependencias Faltantes
```bash
# Reinstalar dependencias
npm install
cd client && npm install
```

## 📊 Funcionalidades Principales

### 1. Análisis de Logs
- Subida de archivos .log, .txt, .pdf
- Detección automática de errores
- Clasificación por severidad
- Sugerencias de resolución

### 2. Dashboard
- Estadísticas en tiempo real
- Gráficos de tendencias
- Distribución de errores

### 3. Simulaciones Monte Carlo
- Creación de proyectos
- Configuración de escenarios
- Generación de reportes

### 4. Notificaciones
- Alertas por Telegram (opcional)
- Notificaciones en tiempo real

## 🔐 Seguridad

- Validación de tipos de archivo
- Límites de tamaño de archivo
- Sanitización de entrada
- Manejo seguro de errores

## 🚀 Despliegue

### Producción Local
```bash
npm run build
npm run start
```

### Variables de Entorno Requeridas
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `PORT` - Puerto del servidor (default: 5001)
- `NODE_ENV` - Entorno (development/production)

## 📞 Soporte

Si encuentras problemas:

1. Verifica que todas las dependencias estén instaladas
2. Confirma que la base de datos esté accesible
3. Revisa los logs del servidor para errores específicos
4. Ejecuta las pruebas E2E para identificar problemas

```bash
npm run test:e2e
```