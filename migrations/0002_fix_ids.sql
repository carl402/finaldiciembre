-- Fix ID columns to allow custom IDs
-- Drop and recreate tables with proper ID handling

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "scenarios" CASCADE;
DROP TABLE IF EXISTS "simulation_reports" CASCADE;
DROP TABLE IF EXISTS "simulations" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "errors" CASCADE;
DROP TABLE IF EXISTS "logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Recreate users table
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar UNIQUE,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'viewer',
	"is_active" boolean DEFAULT true,
	"telegram_chat_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Recreate logs table
CREATE TABLE "logs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL UNIQUE,
	"file_size" integer NOT NULL,
	"content" text NOT NULL,
	"uploaded_by" varchar,
	"status" varchar DEFAULT 'processing',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Recreate errors table
CREATE TABLE "errors" (
	"id" varchar PRIMARY KEY NOT NULL,
	"log_id" varchar,
	"error_type" varchar NOT NULL,
	"message" text NOT NULL,
	"line_number" integer,
	"timestamp" timestamp,
	"severity" varchar DEFAULT 'medium',
	"created_at" timestamp DEFAULT now()
);

-- Recreate notifications table
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"type" varchar NOT NULL,
	"message" text NOT NULL,
	"sent" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

-- Recreate projects table
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Recreate simulations table
CREATE TABLE "simulations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"project_id" varchar,
	"name" text NOT NULL,
	"status" varchar DEFAULT 'pending',
	"iterations" integer DEFAULT 1000,
	"config" jsonb,
	"result_report_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Recreate scenarios table
CREATE TABLE "scenarios" (
	"id" varchar PRIMARY KEY NOT NULL,
	"simulation_id" varchar,
	"name" text NOT NULL,
	"variables" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Recreate simulation_reports table
CREATE TABLE "simulation_reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"simulation_id" varchar,
	"project_name" text NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "logs" ADD CONSTRAINT "logs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "errors" ADD CONSTRAINT "errors_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_result_report_id_simulation_reports_id_fk" FOREIGN KEY ("result_report_id") REFERENCES "simulation_reports"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "simulation_reports" ADD CONSTRAINT "simulation_reports_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE no action ON UPDATE no action;

-- Insert demo user
INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active") 
VALUES ('demo-user', 'demo@example.com', 'Demo', 'User', 'admin', true);