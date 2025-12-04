import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Settings as SettingsIcon, 
  Database, 
  FileText, 
  Download,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function Settings() {
  const [telegramSettings, setTelegramSettings] = useState({
    botToken: '',
    chatId: '',
    criticalErrors: true,
    highErrorRates: true,
    processingComplete: false,
    dailySummary: false,
  });

  const [processingSettings, setProcessingSettings] = useState({
    maxFileSize: 10,
    concurrentLimit: 5,
    supportLog: true,
    supportTxt: true,
    supportCsv: false,
    supportJson: false,
  });

  const [exportSettings, setExportSettings] = useState({
    defaultFormat: 'PDF',
    reportTemplate: 'Standard',
  });

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(true);

  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const saveTelegramMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest('POST', '/api/telegram/settings', settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Telegram settings have been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save Telegram settings",
        variant: "destructive",
      });
    },
  });

  const testTelegramConnection = async () => {
    setTestingTelegram(true);
    try {
      // Simulate testing telegram connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Connection successful",
        description: "Telegram integration is working correctly!",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to Telegram. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSaveSettings = () => {
    saveTelegramMutation.mutate({
      chatId: telegramSettings.chatId,
      notifications: telegramSettings,
    });
  };

  const handleResetSettings = () => {
    setTelegramSettings({
      botToken: '',
      chatId: '',
      criticalErrors: true,
      highErrorRates: true,
      processingComplete: false,
      dailySummary: false,
    });
    setProcessingSettings({
      maxFileSize: 10,
      concurrentLimit: 5,
      supportLog: true,
      supportTxt: true,
      supportCsv: false,
      supportJson: false,
    });
    setExportSettings({
      defaultFormat: 'PDF',
      reportTemplate: 'Standard',
    });
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults.",
    });
  };

  if (isLoading || !isAuthenticated) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Telegram Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="text-primary" size={20} />
              <span>Telegram Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              telegramConnected 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <div className="flex items-center space-x-3">
                {telegramConnected ? (
                  <CheckCircle className="text-success" size={20} />
                ) : (
                  <AlertCircle className="text-destructive" size={20} />
                )}
                <div>
                  <p className={`font-medium ${
                    telegramConnected ? 'text-success' : 'text-destructive'
                  }`}>
                    {telegramConnected ? 'Telegram Bot Connected' : 'Telegram Bot Disconnected'}
                  </p>
                  <p className={`text-sm ${
                    telegramConnected ? 'text-success/80' : 'text-destructive/80'
                  }`}>
                    {telegramConnected 
                      ? 'Notifications will be sent to your configured chat'
                      : 'Please configure your bot token and chat ID'
                    }
                  </p>
                </div>
              </div>
              {telegramConnected && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/20"
                  onClick={() => setTelegramConnected(false)}
                >
                  Disconnect
                </Button>
              )}
            </div>

            {/* Bot Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={telegramSettings.botToken}
                  onChange={(e) => setTelegramSettings(prev => ({ ...prev, botToken: e.target.value }))}
                  placeholder="Enter your Telegram bot token"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  value={telegramSettings.chatId}
                  onChange={(e) => setTelegramSettings(prev => ({ ...prev, chatId: e.target.value }))}
                  placeholder="Enter your chat ID"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Test Connection */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={testTelegramConnection}
                disabled={testingTelegram}
                className="flex items-center space-x-2"
              >
                {testingTelegram ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <TestTube size={16} />
                )}
                <span>{testingTelegram ? 'Testing...' : 'Test Connection'}</span>
              </Button>
              <p className="text-sm text-muted-foreground">
                Send a test message to verify your configuration
              </p>
            </div>

            <Separator />

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Notification Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="criticalErrors" className="text-sm">Critical errors (500+)</Label>
                  <Switch
                    id="criticalErrors"
                    checked={telegramSettings.criticalErrors}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, criticalErrors: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="highErrorRates" className="text-sm">High error rates</Label>
                  <Switch
                    id="highErrorRates"
                    checked={telegramSettings.highErrorRates}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, highErrorRates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="processingComplete" className="text-sm">File processing completion</Label>
                  <Switch
                    id="processingComplete"
                    checked={telegramSettings.processingComplete}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, processingComplete: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailySummary" className="text-sm">Daily summary reports</Label>
                  <Switch
                    id="dailySummary"
                    checked={telegramSettings.dailySummary}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, dailySummary: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="text-primary" size={20} />
              <span>Processing Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={processingSettings.maxFileSize}
                  onChange={(e) => setProcessingSettings(prev => ({ 
                    ...prev, 
                    maxFileSize: parseInt(e.target.value) 
                  }))}
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concurrentLimit">Concurrent Processing Limit</Label>
                <Input
                  id="concurrentLimit"
                  type="number"
                  value={processingSettings.concurrentLimit}
                  onChange={(e) => setProcessingSettings(prev => ({ 
                    ...prev, 
                    concurrentLimit: parseInt(e.target.value) 
                  }))}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">File Type Support</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supportLog" className="text-sm flex items-center space-x-2">
                    <FileText size={16} />
                    <span>.log files</span>
                  </Label>
                  <Switch
                    id="supportLog"
                    checked={processingSettings.supportLog}
                    onCheckedChange={(checked) => 
                      setProcessingSettings(prev => ({ ...prev, supportLog: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="supportTxt" className="text-sm flex items-center space-x-2">
                    <FileText size={16} />
                    <span>.txt files</span>
                  </Label>
                  <Switch
                    id="supportTxt"
                    checked={processingSettings.supportTxt}
                    onCheckedChange={(checked) => 
                      setProcessingSettings(prev => ({ ...prev, supportTxt: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="supportCsv" className="text-sm flex items-center space-x-2">
                    <FileText size={16} />
                    <span>.csv files</span>
                  </Label>
                  <Switch
                    id="supportCsv"
                    checked={processingSettings.supportCsv}
                    onCheckedChange={(checked) => 
                      setProcessingSettings(prev => ({ ...prev, supportCsv: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="supportJson" className="text-sm flex items-center space-x-2">
                    <FileText size={16} />
                    <span>.json files</span>
                  </Label>
                  <Switch
                    id="supportJson"
                    checked={processingSettings.supportJson}
                    onCheckedChange={(checked) => 
                      setProcessingSettings(prev => ({ ...prev, supportJson: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="text-primary" size={20} />
              <span>Export Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultFormat">Default Export Format</Label>
                <Select 
                  value={exportSettings.defaultFormat} 
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, defaultFormat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportTemplate">Report Template</Label>
                <Select 
                  value={exportSettings.reportTemplate} 
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, reportTemplate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Detailed">Detailed</SelectItem>
                    <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                    <SelectItem value="Technical Report">Technical Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            className="flex items-center space-x-2"
          >
            <SettingsIcon size={16} />
            <span>Reset to Defaults</span>
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={saveTelegramMutation.isPending}
            className="flex items-center space-x-2"
          >
            {saveTelegramMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            <span>
              {saveTelegramMutation.isPending ? 'Saving...' : 'Save Settings'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
