import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorResolutionSuggestionsProps {
  errorType: string;
  suggestions: string[];
}

const errorTypeColors: Record<string, string> = {
  '404': 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  '500': 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20',
  '401': 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  '403': 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
  'APPLICATION_ERROR': 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  'DATABASE_ERROR': 'border-l-red-600 bg-red-50 dark:bg-red-950/20',
  'SECURITY_VIOLATION': 'border-l-red-700 bg-red-50 dark:bg-red-950/20',
};

const errorTypeNames: Record<string, string> = {
  '404': '404 Not Found Errors',
  '500': '500 Server Errors',
  '401': '401 Unauthorized Errors',
  '403': '403 Forbidden Errors',
  'APPLICATION_ERROR': 'Application Errors',
  'DATABASE_ERROR': 'Database Errors',
  'SECURITY_VIOLATION': 'Security Violations',
};

export default function ErrorResolutionSuggestions({ 
  errorType, 
  suggestions 
}: ErrorResolutionSuggestionsProps) {
  const colorClass = errorTypeColors[errorType] || 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
  const displayName = errorTypeNames[errorType] || errorType;

  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Lightbulb className="text-warning" size={20} />
          <span>💡 {displayName} - Resolution Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span className="text-sm text-foreground">{suggestion}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink size={16} className="mr-2" />
            View Detailed Documentation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
