import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download, Search, Calendar, Trash2, Eye } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";


export default function Reports() {
  const [projectName, setProjectName] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  const fetchReports = async () => {
    if (!projectName) return toast({ title: 'Ingresa el nombre del proyecto' });
    try {
      const res = await fetch(`/api/reports?projectName=${encodeURIComponent(projectName)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReports(data.reverse());
    } catch (e) {
      toast({ title: 'Error al obtener reportes' });
    }
  };

  const downloadJSON = (report: any) => {
    const blob = new Blob([JSON.stringify(report.report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.projectName}_${report.id}_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({ title: 'Reporte descargado' });
  };

  const deleteReport = async (id: string) => {
    // No server delete implemented for simulation reports yet - remove locally
    setReports(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Reporte eliminado localmente' });
  };

  if (isLoading || !isAuthenticated) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Reportes de Simulaciones</h2>
            <p className="text-muted-foreground">Introduce el nombre del proyecto para ver los reportes generados por simulaciones.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Input placeholder="Nombre del proyecto" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-64" />
            <Button onClick={fetchReports}><Search className="mr-2" />Buscar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center"><FileText className="mr-2" />{report.name}</CardTitle>
                  <div className="text-sm text-muted-foreground"><Calendar className="mr-1 inline" />{new Date(report.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => downloadJSON(report)}><Download className="mr-1" />Descargar JSON</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)} className="text-destructive">Eliminar</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">Iteraciones: {report.iterations}</div>
                  {report.report?.scenarios?.map((sc: any) => (
                    <div key={sc.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{sc.name}</div>
                        <div className="text-sm text-muted-foreground">n={sc.samplesSummary?.n}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <div className="w-full h-48 bg-muted rounded p-4">
                            <div className="text-sm font-medium mb-2">Distribución de Resultados</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {sc.histogram?.map((h: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                  <span>{h.range}</span>
                                  <span>{h.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm">Media: {sc.samplesSummary?.mean?.toFixed(2)} </div>
                          <div className="text-sm">SD: {sc.samplesSummary?.sd?.toFixed(2)}</div>
                          <div className="text-sm">P50: {sc.samplesSummary?.p50}</div>
                          <div className="mt-4">
                            {sc.variables?.map((v: any, i: number) => (
                              <div key={i} className="text-xs text-muted-foreground">{v.name}: {v.distribution}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {reports.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">No se encontraron reportes</h3>
                <p className="text-muted-foreground">Introduce el nombre de un proyecto que tenga simulaciones ejecutadas.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}