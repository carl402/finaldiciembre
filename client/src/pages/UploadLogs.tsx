import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Eye, PlusCircle, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Variable = { name: string; distribution: "uniform" | "normal"; params: any };
type Scenario = { id?: string; name: string; variables: Variable[] };

export default function UploadLogs() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectCreated, setProjectCreated] = useState<any>(null);

  const [simulationName, setSimulationName] = useState("");
  const [iterations, setIterations] = useState<number>(1000);
  const [formula, setFormula] = useState<string>("");
  const [simulationCreated, setSimulationCreated] = useState<any>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newVariables, setNewVariables] = useState<Variable[]>([]);

  const [runningReport, setRunningReport] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  const createProject = async () => {
    if (!projectName) return toast({ title: "Project name required" });
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: projectName, description: projectDesc, createdBy: 'demo-user' }) });
      const data = await res.json();
      setProjectCreated(data);
      toast({ title: 'Proyecto creado', description: data.name });
    } catch (e) {
      toast({ title: 'Error creating project' });
    }
  };

  const createSimulation = async () => {
    if (!projectCreated) return toast({ title: 'Create project first' });
    if (!simulationName) return toast({ title: 'Simulation name required' });
    try {
      const res = await fetch('/api/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: projectCreated.id, name: simulationName, iterations, config: { formula } }) });
      const data = await res.json();
      setSimulationCreated(data);
      toast({ title: 'Simulación creada', description: data.name });
    } catch (e) {
      toast({ title: 'Error creating simulation' });
    }
  };

  const addVariable = () => {
    setNewVariables(prev => [...prev, { name: '', distribution: 'uniform', params: { min: 0, max: 1 } }]);
  };

  const updateVar = (idx: number, field: string, value: any) => {
    setNewVariables(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const addScenario = async () => {
    if (!simulationCreated) return toast({ title: 'Create simulation first' });
    if (!newScenarioName) return toast({ title: 'Scenario name required' });
    try {
      const res = await fetch(`/api/simulations/${simulationCreated.id}/scenarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newScenarioName, variables: newVariables }) });
      const data = await res.json();
      setScenarios(prev => [...prev, data]);
      setNewScenarioName('');
      setNewVariables([]);
      toast({ title: 'Escenario creado', description: data.name });
    } catch (e) {
      toast({ title: 'Error creating scenario' });
    }
  };

  const runSimulation = async () => {
    if (!simulationCreated) return toast({ title: 'Create simulation first' });
    try {
      setRunningReport(null);
      const res = await fetch(`/api/simulations/${simulationCreated.id}/run`, { method: 'POST' });
      const data = await res.json();
      setRunningReport(data);
      toast({ title: 'Simulación ejecutada', description: 'Reporte generado' });
    } catch (e) {
      toast({ title: 'Error running simulation' });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Simulaciones (Monte Carlo)</h2>
                <p className="text-muted-foreground">Crea proyectos, simulaciones y escenarios. Ejecuta simulaciones y revisa reportes.</p>
              </div>
              <div className="text-sm text-muted-foreground">Mantiene gestión de usuarios</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input placeholder="Nombre del proyecto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <Textarea placeholder="Descripción (opcional)" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="mt-2" />
                <Button className="mt-3" onClick={createProject}>Crear Proyecto</Button>
                {projectCreated && <div className="mt-2 text-sm text-muted-foreground">Proyecto: {projectCreated.name}</div>}
              </div>

              <div>
                <Input placeholder="Nombre de la simulación" value={simulationName} onChange={(e) => setSimulationName(e.target.value)} />
                <div className="flex items-center space-x-2 mt-2">
                  <Input type="number" value={iterations} onChange={(e) => setIterations(Number(e.target.value))} />
                  <Input placeholder="Fórmula (ej: a + b*2)" value={formula} onChange={(e) => setFormula(e.target.value)} />
                </div>
                <Button className="mt-3" onClick={createSimulation}>Crear Simulación</Button>
                {simulationCreated && <div className="mt-2 text-sm text-muted-foreground">Simulación: {simulationCreated.name}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {simulationCreated && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Escenarios</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={addVariable}><PlusCircle className="mr-1" />Agregar Variable</Button>
                  <Button onClick={addScenario}><PlusCircle className="mr-1" />Agregar Escenario</Button>
                </div>
              </div>

              <div className="mb-4">
                <Input placeholder="Nombre del escenario" value={newScenarioName} onChange={(e) => setNewScenarioName(e.target.value)} />
              </div>

              <div className="space-y-3">
                {newVariables.map((v, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Nombre variable" value={v.name} onChange={(e) => updateVar(idx, 'name', e.target.value)} />
                      <select value={v.distribution} onChange={(e) => updateVar(idx, 'distribution', e.target.value)} className="border rounded px-2 py-1">
                        <option value="uniform">Uniforme</option>
                        <option value="normal">Normal</option>
                      </select>
                      <Button variant="ghost" onClick={() => setNewVariables(prev => prev.filter((_, i) => i !== idx))}><Trash2 /></Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {v.distribution === 'uniform' ? (
                        <>
                          <Input placeholder="min" value={v.params?.min} onChange={(e) => updateVar(idx, 'params', { ...v.params, min: Number(e.target.value) })} />
                          <Input placeholder="max" value={v.params?.max} onChange={(e) => updateVar(idx, 'params', { ...v.params, max: Number(e.target.value) })} />
                        </>
                      ) : (
                        <>
                          <Input placeholder="mean" value={v.params?.mean} onChange={(e) => updateVar(idx, 'params', { ...v.params, mean: Number(e.target.value) })} />
                          <Input placeholder="sd" value={v.params?.sd} onChange={(e) => updateVar(idx, 'params', { ...v.params, sd: Number(e.target.value) })} />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button onClick={runSimulation}><Play className="mr-2"/> Ejecutar Simulación</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {runningReport && (
          <Card>
            <CardHeader>
              <CardTitle>Reporte: {runningReport.projectName} / {runningReport.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Iteraciones: {runningReport.iterations}</div>
                {runningReport.scenarios.map((sc: any) => (
                  <div key={sc.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{sc.name}</div>
                      <div className="text-sm text-muted-foreground">n={sc.samplesSummary?.n}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm">Media: {sc.samplesSummary?.mean.toFixed(2)} | SD: {sc.samplesSummary?.sd.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">P50: {sc.samplesSummary?.p50}</div>
                      </div>
                      <div>
                        <div className="w-full">
                          {/* Simple histogram bars */}
                          {sc.histogram.map((h: any, i: number) => (
                            <div key={i} className="flex items-center mb-1">
                              <div className="w-32 text-xs text-muted-foreground">{h.range}</div>
                              <div className="h-4 bg-primary rounded" style={{ width: `${(h.count / runningReport.iterations) * 100}%` }} />
                              <div className="ml-2 text-sm">{h.count}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}