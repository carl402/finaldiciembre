# Take a Look - Log Analysis System

## Overview

Take a Look is a comprehensive log analysis system built with a React frontend and Express.js backend. The application enables users to upload, process, and analyze log files to detect errors, generate insights, and receive automated notifications. The system features a modern UI built with shadcn/ui components, real-time processing capabilities, and Telegram integration for alerts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Charts**: Chart.js for data visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Processing**: Multer for file uploads with in-memory storage
- **External Services**: Telegram Bot API for notifications

### Database Schema
The system uses PostgreSQL with the following main entities:
- **Users**: Authentication and role-based access control
- **Logs**: Uploaded log files with metadata and processing status
- **Errors**: Detected errors from log analysis with severity levels
- **Notifications**: System notifications and alert management
- **Sessions**: User session storage for authentication

## Key Components

### Authentication System
- Replit Auth integration for user management
- Role-based access control (admin, analyst, viewer)
- Session-based authentication with PostgreSQL storage
- Automatic redirect handling for unauthorized access

### File Processing Pipeline
- Multi-format support (.log, .txt files)
- Hash-based duplicate detection
- Configurable file size limits (10MB default)
- Real-time processing status updates
- Error pattern recognition with severity classification

### Error Detection Engine
- HTTP status code detection (400, 401, 403, 404, 500, etc.)
- Application error pattern matching (ERROR, FATAL, WARNING)
- Security violation detection
- Database and memory error identification
- Line-by-line analysis with context preservation

### Notification System
- Telegram integration for real-time alerts
- Configurable notification preferences
- Critical error threshold alerts
- Processing completion notifications
- Daily summary reports

### Dashboard and Analytics
- Real-time statistics and metrics
- Error trend analysis with Chart.js
- File processing history
- User activity monitoring
- Exportable reports in multiple formats

## Data Flow

1. **File Upload**: Users upload log files through the web interface
2. **Validation**: System validates file type, size, and checks for duplicates
3. **Processing**: Background service analyzes file content for error patterns
4. **Storage**: Processed data is stored in PostgreSQL with Drizzle ORM
5. **Analysis**: Error detection engine categorizes and scores findings
6. **Notification**: Critical errors trigger immediate Telegram alerts
7. **Visualization**: Dashboard displays analytics and trends
8. **Reporting**: Users can view detailed reports and export data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection management
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui**: Headless UI components
- **tailwindcss**: CSS framework
- **chart.js**: Data visualization
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **esbuild**: Server-side bundling
- **tsx**: TypeScript execution

## Deployment Strategy

### Development Environment
- Vite development server for frontend hot reloading
- tsx for TypeScript execution on the server
- Replit integration with cartographer plugin
- Environment-based configuration management

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single-file deployment with external package dependencies
- Static file serving through Express middleware

### Database Management
- Drizzle Kit for schema migrations
- Environment variable configuration for database URLs
- Automatic table creation and session management
- PostgreSQL connection pooling with Neon serverless

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `TELEGRAM_BOT_TOKEN`: Telegram integration (optional)
- `REPLIT_DOMAINS`: Allowed domains for authentication
- `ISSUER_URL`: OpenID Connect provider URL

The system is designed for easy deployment on Replit with minimal configuration, while supporting traditional hosting environments through standard environment variables and database connections.