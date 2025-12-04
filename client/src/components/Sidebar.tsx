import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import {
  Eye,
  Upload,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Subir Logs", href: "/upload", icon: Upload },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Reportes", href: "/reports", icon: Eye },
  { name: "Usuarios", href: "/users", icon: Users },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth() as { user: any; logout: () => void };

  return (
    <div className="sidebar w-64 bg-card backdrop-blur-sm shadow-lg border-r flex flex-col" style={{ backgroundColor: 'hsl(var(--card) / 0.92)' }}>
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Eye className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Take a Look</h1>
            <p className="text-sm text-muted-foreground">Sistema de Análisis de Logs</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div className={cn("nav-item", isActive && "active")}>
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={user?.profileImageUrl || ""} 
                alt={`${user?.firstName} ${user?.lastName}`}
              />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role || 'Viewer'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
