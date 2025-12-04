import { storage } from "../storage";
import { simulations as SimTable, scenarios as ScenarioTable, projects as ProjectsTable } from "@shared/schema";

type VariableSpec = {
  name: string;
  distribution: string; // 'normal' | 'uniform'
  params: Record<string, number>;
};

type ScenarioSpec = {
  id?: string;
  name: string;
  variables: VariableSpec[];
};

type SimulationConfig = {
  iterations?: number;
  formula?: string; // optional JS expression using variable names, e.g. "a + b * 2"
};

function sampleVariable(v: VariableSpec): number {
  const d = v.distribution?.toLowerCase?.() || "uniform";
  if (d === "normal") {
    const mean = v.params.mean ?? 0;
    const sd = v.params.sd ?? 1;
    // Box-Muller
    let u = 0, w = 0;
    do {
      u = Math.random() * 2 - 1;
      w = Math.random() * 2 - 1;
    } while (u === 0 && w === 0);
    const c = Math.sqrt(-2.0 * Math.log(u * u + w * w) / (u * u + w * w));
    return mean + sd * u * c;
  }

  // uniform
  const min = v.params.min ?? 0;
  const max = v.params.max ?? 1;
  return min + Math.random() * (max - min);
}

function summarize(samples: number[]) {
  const n = samples.length;
  if (n === 0) return {};
  const mean = samples.reduce((s, v) => s + v, 0) / n;
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const sorted = samples.slice().sort((a, b) => a - b);
  const percentile = (p: number) => {
    const idx = Math.floor((p / 100) * (n - 1));
    return sorted[Math.max(0, Math.min(n - 1, idx))];
  };
  return {
    n,
    mean,
    sd,
    p05: percentile(5),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p95: percentile(95),
  };
}

export class SimulationService {
  async runSimulation(simulationId: string) {
    // Load simulation and scenarios
    const sim = await storage.getSimulationById(simulationId);
    if (!sim) throw new Error("Simulation not found");

    await storage.updateSimulationStatus(simulationId, "running");

    // Get simulation config to get iterations
    const config = await storage.getSimulationConfigById ? 
      await storage.getSimulationConfigById(sim.configId) : null;
    const iterations = config?.iterations || 1000;
    
    const scenarios = await storage.getScenariosBySimulationId(simulationId);

    const project = await storage.getProjectById(sim.projectId);
    const projectName = project?.name || "unknown";

    const simulationConfig: SimulationConfig = { iterations };

    const report: any = {
      simulationId,
      name: (sim as any).name || 'Simulation',
      projectName,
      iterations,
      scenarios: [],
      createdAt: new Date().toISOString(),
    };

    try {
      for (const sc of scenarios) {
        const scenarioResult: any = { id: sc.id, name: (sc as any).name || 'Scenario', variables: (sc as any).variables || [], samplesSummary: null };

        // Run Monte Carlo samples
        const outputs: number[] = [];
        for (let i = 0; i < iterations; i++) {
          const sampleVars: Record<string, number> = {};
          for (const v of ((sc as any).variables || []) as VariableSpec[]) {
            sampleVars[v.name] = sampleVariable(v);
          }

          // compute result: if formula present use it, otherwise sum numeric values
          let out = 0;
          if (simulationConfig.formula) {
            try {
              // Unsafe but simple evaluator for demo: expose vars
              const fn = new Function("vars", `with(vars){ return ${simulationConfig.formula}; }`);
              out = Number(fn(sampleVars)) || 0;
            } catch (e) {
              out = Object.values(sampleVars).reduce((s, v) => s + Number(v || 0), 0);
            }
          } else {
            out = Object.values(sampleVars).reduce((s, v) => s + Number(v || 0), 0);
          }
          outputs.push(out);
        }

        scenarioResult.samplesSummary = summarize(outputs);
        // lightweight histogram (10 buckets)
        const sorted = outputs.slice().sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const buckets = 10;
        const bucketSize = (max - min) / buckets || 1;
        const histogram: { range: string; count: number }[] = [];
        for (let b = 0; b < buckets; b++) {
          const lo = min + b * bucketSize;
          const hi = b === buckets - 1 ? max : lo + bucketSize;
          const cnt = outputs.filter(v => v >= lo && v <= hi).length;
          histogram.push({ range: `${lo.toFixed(2)} - ${hi.toFixed(2)}`, count: cnt });
        }
        scenarioResult.histogram = histogram;

        report.scenarios.push(scenarioResult);
      }

      // Save report
      const saved = await storage.createSimulationReport({ simulationId, projectName, reportData: report } as any);
      await storage.updateSimulationStatus(simulationId, "completed");
      return saved;
    } catch (error) {
      await storage.updateSimulationStatus(simulationId, "failed");
      throw error;
    }
  }
}

export const simulationService = new SimulationService();
