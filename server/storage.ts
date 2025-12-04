import {
  users,
  logs,
  errors,
  notifications,
  projects,
  simulations,
  scenarios,
  simulationReports,
  type User,
  type UpsertUser,
  type Log,
  type InsertLog,
  type Error,
  type InsertError,
  type Notification,
  type InsertNotification,
  type Project,
  type InsertProject,
  type Simulation,
  type InsertSimulation,
  type Scenario,
  type InsertScenario,
  type SimulationReport,
  type InsertSimulationReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  deactivateUser(id: string): Promise<User>;
  
  // Log operations
  createLog(log: InsertLog): Promise<Log>;
  getLogByHash(hash: string): Promise<Log | undefined>;
  getLogById(id: string): Promise<Log | undefined>;
  getAllLogs(limit?: number, offset?: number): Promise<Log[]>;
  getLogsByUser(userId: string): Promise<Log[]>;
  updateLogStatus(id: string, status: string): Promise<Log>;
  getLogStats(): Promise<any>;
  deleteLog(id: string): Promise<void>;
  
  // Error operations
  createError(error: InsertError): Promise<Error>;
  getErrorsByLogId(logId: string): Promise<Error[]>;
  getErrorStats(): Promise<any>;
  getErrorTrends(days: number): Promise<any[]>;
  deleteErrorsByLogId(logId: string): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getPendingNotifications(): Promise<Notification[]>;
  markNotificationSent(id: string): Promise<Notification>;

  // Project/Simulation operations
  createProject(project: InsertProject): Promise<Project>;
  getProjectById(id: string): Promise<Project | undefined>;
  getProjectByName(name: string): Promise<Project | undefined>;

  createSimulation(sim: InsertSimulation): Promise<Simulation>;
  getSimulationById(id: string): Promise<Simulation | undefined>;
  getSimulationsByProjectId(projectId: string): Promise<Simulation[]>;
  updateSimulationStatus(id: string, status: string): Promise<Simulation>;

  createScenario(scenario: InsertScenario): Promise<Scenario>;
  getScenariosBySimulationId(simulationId: string): Promise<Scenario[]>;

  createSimulationReport(report: InsertSimulationReport): Promise<SimulationReport>;
  getReportsByProjectName(projectName: string): Promise<SimulationReport[]>;
  getSimulationReportById(id: string): Promise<SimulationReport | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<any[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deactivateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Log operations
  async createLog(log: any): Promise<any> {
    const [newLog] = await db.insert(logs).values(log as any).returning();
    return newLog;
  }

  async getLogByHash(hash: string): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.fileHash, hash));
    return log;
  }

  async getLogById(id: string): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log;
  }

  async getAllLogs(limit = 50, offset = 0): Promise<any[]> {
    const result = await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit)
      .offset(offset);
    return Array.isArray(result) ? result : [];
  }

  async getLogsByUser(userId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(logs)
      .where(eq(logs.uploadedBy, userId))
      .orderBy(desc(logs.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async updateLogStatus(id: string, status: string): Promise<Log> {
    const [log] = await db
      .update(logs)
      .set({ status, updatedAt: new Date() })
      .where(eq(logs.id, id))
      .returning();
    return log;
  }

  async getLogStats(): Promise<any> {
    const [totalFiles] = await db.select({ count: count() }).from(logs);
    const [completedFiles] = await db
      .select({ count: count() })
      .from(logs)
      .where(eq(logs.status, "completed"));
    
    return {
      totalFiles: totalFiles.count,
      completedFiles: completedFiles.count,
      successRate: totalFiles.count > 0 ? (completedFiles.count / totalFiles.count) * 100 : 0,
    };
  }

  // Error operations
  async createError(error: any): Promise<any> {
    const [newError] = await db.insert(errors).values(error as any).returning();
    return newError;
  }

  async getErrorsByLogId(logId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(errors)
      .where(eq(errors.logId, logId))
      .orderBy(desc(errors.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async getErrorStats(): Promise<any> {
    const errorCounts = await db
      .select({
        errorType: errors.errorType,
        count: count(),
      })
      .from(errors)
      .groupBy(errors.errorType);

    const [totalErrors] = await db.select({ count: count() }).from(errors);

    return {
      totalErrors: totalErrors.count,
      errorDistribution: errorCounts,
    };
  }

  async getErrorTrends(days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const result = await db
        .select({
          date: sql<string>`DATE(${errors.createdAt})`,
          count: count(),
        })
        .from(errors)
        .where(gte(errors.createdAt, startDate))
        .groupBy(sql`DATE(${errors.createdAt})`)
        .orderBy(sql`DATE(${errors.createdAt})`);
      return result || [];
    } catch (error) {
      console.error('Error getting error trends:', error);
      return [];
    }
  }

  async deleteErrorsByLogId(logId: string): Promise<void> {
    await db.delete(errors).where(eq(errors.logId, logId));
  }

  async deleteLog(id: string): Promise<void> {
    await db.delete(logs).where(eq(logs.id, id));
  }

  // Notification operations
  async createNotification(notification: any): Promise<any> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification as any)
      .returning();
    return newNotification;
  }

  async getPendingNotifications(): Promise<any[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.sent, false))
      .orderBy(desc(notifications.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async markNotificationSent(id: string): Promise<any> {
    const [notification] = await db
      .update(notifications)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Project / Simulation operations
  async createProject(project: any): Promise<any> {
    const [p] = await db.insert(projects).values(project as any).returning();
    return p;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [p] = await db.select().from(projects).where(eq(projects.id, id));
    return p;
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    const [p] = await db.select().from(projects).where(eq(projects.name, name));
    return p;
  }

  async createSimulation(sim: any): Promise<any> {
    const res = await db.insert(simulations).values(sim as any).returning();
    const s = Array.isArray(res) ? res[0] : (res as any);
    return s;
  }

  async getSimulationById(id: string): Promise<Simulation | undefined> {
    const [s] = await db.select().from(simulations).where(eq(simulations.id, id));
    return s;
  }

  async getSimulationsByProjectId(projectId: string): Promise<any[]> {
    const result = await db.select().from(simulations).where(eq(simulations.projectId, projectId)).orderBy(desc(simulations.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async updateSimulationStatus(id: string, status: string): Promise<any> {
    const [s] = await db.update(simulations).set({ status: status as any }).where(eq(simulations.id, id)).returning();
    return s;
  }

  async createScenario(scenario: any): Promise<any> {
    const res = await db.insert(scenarios).values(scenario as any).returning();
    const sc = Array.isArray(res) ? res[0] : (res as any);
    return sc;
  }

  async getScenariosBySimulationId(simulationId: string): Promise<any[]> {
    const result = await db.select().from(scenarios).where(eq(scenarios.simulationId, simulationId)).orderBy(desc(scenarios.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async createSimulationReport(report: any): Promise<any> {
    const res = await db.insert(simulationReports).values(report as any).returning();
    const r = Array.isArray(res) ? res[0] : (res as any);
    return r;
  }

  async getReportsByProjectName(projectName: string): Promise<any[]> {
    const result = await db.select().from(simulationReports).where(eq(simulationReports.projectName, projectName)).orderBy(desc(simulationReports.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async getSimulationReportById(id: string): Promise<any> {
    const [r] = await db.select().from(simulationReports).where(eq(simulationReports.id, id));
    return r;
  }

  // Monte Carlo specific methods
  async getAllProjects(): Promise<any[]> {
    const result = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async createUser(userData: any): Promise<any> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: any): Promise<any> {
    const [user] = await db.update(users).set({...userData, updatedAt: new Date()}).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllReports(): Promise<any[]> {
    const result = await db.select().from(simulationReports).orderBy(desc(simulationReports.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async createReport(reportData: any): Promise<any> {
    const [report] = await db.insert(simulationReports).values(reportData).returning();
    return report;
  }

  async getReportById(id: string): Promise<any> {
    const [report] = await db.select().from(simulationReports).where(eq(simulationReports.id, id));
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(simulationReports).where(eq(simulationReports.id, id));
  }
}

export const storage = new DatabaseStorage();
