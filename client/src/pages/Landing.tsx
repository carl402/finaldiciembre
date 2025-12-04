import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, BarChart3, Shield, Zap, Upload, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>
      
      <div className="relative">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Eye className="text-primary-foreground" size={20} />
              </div>
              <span className="text-2xl font-bold text-foreground">Take a Look</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="p-2 rounded-full border border-accent hover:bg-accent/20"
              >
                {theme === "light" ? (
                  <Sun className="text-primary" size={20} />
                ) : (
                  <Moon className="text-accent" size={20} />
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/login"}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = "/login"}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Powerful Log Analysis
              <span className="text-primary block">Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload, analyze, and get instant insights from your log files. 
              Detect errors, track trends, and receive intelligent suggestions 
              for resolution—all in one powerful platform.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/login"}
                className="text-lg px-8 py-6"
              >
                Start Analyzing Logs
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6"
              >
                View Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Log Analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to help you understand your logs, 
              identify issues, and maintain system health.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="text-primary" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Easy Upload
                </h3>
                <p className="text-muted-foreground text-sm">
                  Support for .log and .txt files with drag-and-drop interface. 
                  Automatic duplicate detection and validation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-accent-foreground" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Rich Analytics
                </h3>
                <p className="text-muted-foreground text-sm">
                  Interactive dashboards with error distribution charts, 
                  trends analysis, and comprehensive reporting.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-success" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Smart Suggestions
                </h3>
                <p className="text-muted-foreground text-sm">
                  AI-powered error resolution suggestions help you fix 
                  issues faster with actionable recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-warning" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Real-time Alerts
                </h3>
                <p className="text-muted-foreground text-sm">
                  Telegram integration for instant notifications about 
                  critical errors and system health updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="text-center py-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Join thousands of developers who trust Take a Look 
                for their log analysis needs. Start analyzing your logs today.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => window.location.href = "/login"}
                className="text-lg px-8 py-6"
              >
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Eye className="text-primary-foreground" size={16} />
              </div>
              <span className="text-lg font-semibold text-foreground">Take a Look</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Take a Look. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
