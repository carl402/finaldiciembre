import { Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: logs } = useQuery({ queryKey: ["/api/logs"] });

  // Generar notificaciones a partir de los logs
  const notifications = Array.isArray(logs)
    ? logs.map((log: any) => {
        if (log.errorCount > 0) {
          return {
            id: log.id,
            message: `Se detectaron ${log.errorCount} error(es) (${log.status}) en el archivo ${log.fileName}`,
            type: log.status === 'completed' ? 'error' : 'info',
            logId: log.id,
          };
        } else {
          return {
            id: log.id,
            message: `¡Buen trabajo! No se detectaron errores en el archivo ${log.fileName}`,
            type: 'success',
            logId: log.id,
          };
        }
      })
    : [];

  return (
    <header className="header bg-card backdrop-blur-sm shadow-sm border-b border-border" style={{ backgroundColor: 'hsl(var(--card) / 0.92)' }}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Telegram Integration Status */}
            <Badge variant="secondary" className="bg-success/10 text-success">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Telegram Connected
            </Badge>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>

            {/* Notifications */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-muted-foreground hover:text-foreground"
                  aria-label="Ver notificaciones"
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notificaciones</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-muted-foreground text-center">No hay notificaciones</div>
                  ) : (
                    notifications.map((notif: any) => (
                      <div key={notif.id} className="flex items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <span className={notif.type === 'success' ? 'text-success' : notif.type === 'error' ? 'text-destructive' : 'text-warning'}>
                            {notif.message}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = `/reports?log=${notif.logId}`}>
                          Ver reporte
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
