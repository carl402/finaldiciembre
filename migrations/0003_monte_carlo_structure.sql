-- Migration: Monte Carlo Project Structure
-- Add password field to users and update project structure

-- Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;

-- Update users table structure
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'analyst';

-- Update projects table for Monte Carlo structure
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS responsible_user VARCHAR REFERENCES users(id);
ALTER TABLE projects ALTER COLUMN responsible_user SET NOT NULL;

-- Create project_variables table
CREATE TABLE IF NOT EXISTS project_variables (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    type VARCHAR NOT NULL, -- continua, discreta
    distribution VARCHAR NOT NULL, -- normal, uniforme, triangular
    parameters JSONB NOT NULL, -- {media, desviacion} or {min, max} etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create simulation_configs table
CREATE TABLE IF NOT EXISTS simulation_configs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    iterations INTEGER DEFAULT 1000,
    random_seed INTEGER,
    execution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update simulations table structure
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS config_id VARCHAR REFERENCES simulation_configs(id);
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS results JSONB;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE simulations ALTER COLUMN project_id SET NOT NULL;

-- Update scenarios table for Monte Carlo structure
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS iteration_number INTEGER;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS simulated_values JSONB;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS calculated_result TEXT;
ALTER TABLE scenarios ALTER COLUMN simulation_id SET NOT NULL;

-- Update simulation_reports table
ALTER TABLE simulation_reports ADD COLUMN IF NOT EXISTS report_data JSONB;
ALTER TABLE simulation_reports ADD COLUMN IF NOT EXISTS format VARCHAR DEFAULT 'json';
ALTER TABLE simulation_reports ALTER COLUMN simulation_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_variables_project_id ON project_variables(project_id);
CREATE INDEX IF NOT EXISTS idx_simulation_configs_project_id ON simulation_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_simulation_id ON scenarios(simulation_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_iteration ON scenarios(iteration_number);

-- Insert default admin user
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES ('admin@montecarlo.com', 'admin123', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default analyst user
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES ('analyst@montecarlo.com', 'analyst123', 'Analyst', 'User', 'analyst')
ON CONFLICT (email) DO NOTHING;