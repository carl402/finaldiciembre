import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("analyst"), // admin, analyst
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Log files table
export const logs = pgTable("logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileHash: text("file_hash").notNull().unique(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  status: varchar("status").default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Errors detected in logs
export const errors = pgTable("errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logId: varchar("log_id").references(() => logs.id),
  errorType: varchar("error_type").notNull(), // 404, 500, 401, etc.
  message: text("message").notNull(),
  lineNumber: integer("line_number"),
  timestamp: timestamp("timestamp"),
  severity: varchar("severity").default("medium"), // low, medium, high, critical
  createdAt: timestamp("created_at").defaultNow(),
});

// Telegram notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // error_alert, daily_summary, processing_complete
  message: text("message").notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects (Monte Carlo simulations)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: varchar("status").default("active"), // active, inactive
  responsibleUser: varchar("responsible_user").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Variables for Monte Carlo projects
export const projectVariables = pgTable("project_variables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  type: varchar("type").notNull(), // continua, discreta
  distribution: varchar("distribution").notNull(), // normal, uniforme, triangular
  parameters: jsonb("parameters").notNull(), // {media, desviacion} or {min, max} etc
  createdAt: timestamp("created_at").defaultNow(),
});

// Simulation configuration
export const simulationConfigs = pgTable("simulation_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  iterations: integer("iterations").default(1000),
  randomSeed: integer("random_seed"),
  executionDate: timestamp("execution_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Simulation executions
export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  configId: varchar("config_id").references(() => simulationConfigs.id).notNull(),
  status: varchar("status").default("pending"), // pending, running, completed, failed
  results: jsonb("results"), // metrics: promedio, desviacion, percentiles
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Scenarios (each iteration result)
export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  simulationId: varchar("simulation_id").references(() => simulations.id).notNull(),
  iterationNumber: integer("iteration_number").notNull(),
  simulatedValues: jsonb("simulated_values").notNull(), // {variable1: value1, variable2: value2}
  calculatedResult: text("calculated_result").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports generated by simulations
export const simulationReports = pgTable("simulation_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  simulationId: varchar("simulation_id").references(() => simulations.id).notNull(),
  projectName: text("project_name").notNull(),
  reportData: jsonb("report_data").notNull(), // histograms, metrics, visualizations
  format: varchar("format").default("json"), // json, pdf, csv
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  logs: many(logs),
  notifications: many(notifications),
}));

export const logsRelations = relations(logs, ({ one, many }) => ({
  uploadedByUser: one(users, {
    fields: [logs.uploadedBy],
    references: [users.id],
  }),
  errors: many(errors),
}));

export const errorsRelations = relations(errors, ({ one }) => ({
  log: one(logs, {
    fields: [errors.logId],
    references: [logs.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  responsibleUser: one(users, {
    fields: [projects.responsibleUser],
    references: [users.id],
  }),
  variables: many(projectVariables),
  configs: many(simulationConfigs),
  simulations: many(simulations),
}));

export const projectVariablesRelations = relations(projectVariables, ({ one }) => ({
  project: one(projects, {
    fields: [projectVariables.projectId],
    references: [projects.id],
  }),
}));

export const simulationConfigsRelations = relations(simulationConfigs, ({ one }) => ({
  project: one(projects, {
    fields: [simulationConfigs.projectId],
    references: [projects.id],
  }),
}));

export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  project: one(projects, {
    fields: [simulations.projectId],
    references: [projects.id],
  }),
  config: one(simulationConfigs, {
    fields: [simulations.configId],
    references: [simulationConfigs.id],
  }),
  scenarios: many(scenarios),
  reports: many(simulationReports),
}));

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  simulation: one(simulations, {
    fields: [scenarios.simulationId],
    references: [simulations.id],
  }),
}));

export const simulationReportsRelations = relations(simulationReports, ({ one }: any) => ({
  simulation: one(simulations, {
    fields: [simulationReports.simulationId],
    references: [simulations.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorSchema = createInsertSchema(errors).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectVariableSchema = createInsertSchema(projectVariables).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationConfigSchema = createInsertSchema(simulationConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationReportSchema = createInsertSchema(simulationReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertError = z.infer<typeof insertErrorSchema>;
export type Error = typeof errors.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectVariable = z.infer<typeof insertProjectVariableSchema>;
export type ProjectVariable = typeof projectVariables.$inferSelect;

export type InsertSimulationConfig = z.infer<typeof insertSimulationConfigSchema>;
export type SimulationConfig = typeof simulationConfigs.$inferSelect;

export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulations.$inferSelect;

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;

export type InsertSimulationReport = z.infer<typeof insertSimulationReportSchema>;
export type SimulationReport = typeof simulationReports.$inferSelect;
