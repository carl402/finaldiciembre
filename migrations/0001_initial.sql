-- Initial migration for Take a Look system
-- Create sessions table (required for authentication)
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
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

-- Create logs table
CREATE TABLE IF NOT EXISTS "logs" (
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

-- Create errors table
CREATE TABLE IF NOT EXISTS "errors" (
	"id" varchar PRIMARY KEY NOT NULL,
	"log_id" varchar,
	"error_type" varchar NOT NULL,
	"message" text NOT NULL,
	"line_number" integer,
	"timestamp" timestamp,
	"severity" varchar DEFAULT 'medium',
	"created_at" timestamp DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"type" varchar NOT NULL,
	"message" text NOT NULL,
	"sent" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create simulations table
CREATE TABLE IF NOT EXISTS "simulations" (
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

-- Create scenarios table
CREATE TABLE IF NOT EXISTS "scenarios" (
	"id" varchar PRIMARY KEY NOT NULL,
	"simulation_id" varchar,
	"name" text NOT NULL,
	"variables" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create simulation_reports table
CREATE TABLE IF NOT EXISTS "simulation_reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"simulation_id" varchar,
	"project_name" text NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "logs" ADD CONSTRAINT "logs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "errors" ADD CONSTRAINT "errors_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "simulations" ADD CONSTRAINT "simulations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "simulations" ADD CONSTRAINT "simulations_result_report_id_simulation_reports_id_fk" FOREIGN KEY ("result_report_id") REFERENCES "simulation_reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "simulation_reports" ADD CONSTRAINT "simulation_reports_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Insert demo user
INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active") 
VALUES ('demo-user', 'demo@example.com', 'Demo', 'User', 'admin', true)
ON CONFLICT ("id") DO NOTHING;