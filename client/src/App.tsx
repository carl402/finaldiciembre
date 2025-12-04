import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UploadLogs from "@/pages/UploadLogs";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const pageConfig = {
  "/": {
    title: 'Upload Logs',
    subtitle: 'Upload and process log files for analysis',
    component: UploadLogs,
  },
  "/upload": {
    title: 'Upload Logs',
    subtitle: 'Upload and process log files for analysis',
    component: UploadLogs,
  },
  "/dashboard": {
    title: 'Dashboard',
    subtitle: 'Monitor your log analysis activity',
    component: Dashboard,
  },
  "/reports": {
    title: 'Reports',
    subtitle: 'View detailed analysis reports and error suggestions',
    component: Reports,
  },
  "/users": {
    title: 'User Management',
    subtitle: 'Manage system users and their permissions',
    component: Users,
  },
  "/settings": {
    title: 'Settings',
    subtitle: 'Configure system preferences and integrations',
    component: Settings,
  },
};

function AppLayout({ children, title, subtitle }: { 
  children: React.ReactNode; 
  title: string; 
  subtitle: string; 
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      {Object.entries(pageConfig).map(([path, config]) => (
        <Route key={path} path={path}>
          <AppLayout title={config.title} subtitle={config.subtitle}>
            <config.component />
          </AppLayout>
        </Route>
      ))}
      <Route component={() => (
        <AppLayout title="Page Not Found" subtitle="The requested page could not be found">
          <NotFound />
        </AppLayout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
