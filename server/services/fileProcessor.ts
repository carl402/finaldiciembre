interface DetectedError {
  type: string;
  message: string;
  lineNumber: number;
  severity: 'leve' | 'medio' | 'critico';
}

class FileProcessor {
  async processLogFile(logId: string, content: string): Promise<DetectedError[]> {
    const lines = content.split('\n');
    const detectedErrors: DetectedError[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // HTTP error patterns
      const httpErrorPatterns = [
        { pattern: /\s400\s/, type: '400', severity: 'medio' as const, message: 'Bad Request' },
        { pattern: /\s401\s/, type: '401', severity: 'critico' as const, message: 'Unauthorized Access' },
        { pattern: /\s403\s/, type: '403', severity: 'critico' as const, message: 'Forbidden Access' },
        { pattern: /\s404\s/, type: '404', severity: 'medio' as const, message: 'Resource Not Found' },
        { pattern: /\s500\s/, type: '500', severity: 'critico' as const, message: 'Internal Server Error' },
        { pattern: /\s502\s/, type: '502', severity: 'critico' as const, message: 'Bad Gateway' },
        { pattern: /\s503\s/, type: '503', severity: 'critico' as const, message: 'Service Unavailable' },
        { pattern: /\s504\s/, type: '504', severity: 'critico' as const, message: 'Gateway Timeout' },
      ];

      // Check for HTTP errors
      for (const errorPattern of httpErrorPatterns) {
        if (errorPattern.pattern.test(line)) {
          detectedErrors.push({
            type: errorPattern.type,
            message: `${errorPattern.message}: ${line.trim()}`,
            lineNumber,
            severity: errorPattern.severity,
          });
        }
      }

      // Application error patterns
      const appErrorPatterns = [
        { pattern: /ERROR/i, type: 'APPLICATION_ERROR', severity: 'medio' as const },
        { pattern: /FATAL/i, type: 'FATAL_ERROR', severity: 'critico' as const },
        { pattern: /WARN(ING)?/i, type: 'WARNING', severity: 'leve' as const },
        { pattern: /EXCEPTION/i, type: 'EXCEPTION', severity: 'medio' as const },
        { pattern: /TIMEOUT/i, type: 'TIMEOUT', severity: 'medio' as const },
        { pattern: /CONNECTION\s+(FAILED|REFUSED|RESET)/i, type: 'CONNECTION_ERROR', severity: 'medio' as const },
        { pattern: /DATABASE\s+ERROR/i, type: 'DATABASE_ERROR', severity: 'critico' as const },
        { pattern: /OUT\s+OF\s+MEMORY/i, type: 'MEMORY_ERROR', severity: 'critico' as const },
      ];

      // Check for application errors
      for (const errorPattern of appErrorPatterns) {
        if (errorPattern.pattern.test(line)) {
          detectedErrors.push({
            type: errorPattern.type,
            message: line.trim(),
            lineNumber,
            severity: errorPattern.severity,
          });
        }
      }

      // Security patterns
      const securityPatterns = [
        { pattern: /SECURITY\s+VIOLATION/i, type: 'SECURITY_VIOLATION', severity: 'critico' as const },
        { pattern: /FAILED\s+LOGIN/i, type: 'FAILED_LOGIN', severity: 'medio' as const },
        { pattern: /BRUTE\s+FORCE/i, type: 'BRUTE_FORCE', severity: 'critico' as const },
        { pattern: /SQL\s+INJECTION/i, type: 'SQL_INJECTION', severity: 'critico' as const },
        { pattern: /XSS\s+ATTACK/i, type: 'XSS_ATTACK', severity: 'critico' as const },
      ];

      // Check for security issues
      for (const securityPattern of securityPatterns) {
        if (securityPattern.pattern.test(line)) {
          detectedErrors.push({
            type: securityPattern.type,
            message: line.trim(),
            lineNumber,
            severity: securityPattern.severity,
          });
        }
      }
    }

    return detectedErrors;
  }

  getErrorResolutionSuggestions(errorType: string): string[] {
    const suggestions: Record<string, string[]> = {
      '404': [
        'Check for broken internal links and fix them',
        'Implement proper redirects for moved or deleted content',
        'Create custom 404 error pages with helpful navigation',
        'Review and update your sitemap',
        'Set up monitoring for frequently accessed missing resources',
      ],
      '500': [
        'Review server error logs for detailed stack traces',
        'Check database connectivity and query performance',
        'Monitor server resource usage (CPU, memory, disk)',
        'Implement proper error handling in application code',
        'Set up automated alerting for server errors',
      ],
      '401': [
        'Review authentication token expiration policies',
        'Check for issues with session management',
        'Implement proper error handling for expired sessions',
        'Consider implementing refresh token mechanisms',
        'Review access control configurations',
      ],
      '403': [
        'Review user permission settings and role-based access',
        'Check for proper authorization implementations',
        'Audit file and directory permissions',
        'Review API endpoint access controls',
        'Implement proper error messages for access denials',
      ],
      'APPLICATION_ERROR': [
        'Add comprehensive logging to identify root causes',
        'Implement proper exception handling',
        'Review recent code changes for potential issues',
        'Set up application performance monitoring',
        'Consider implementing circuit breaker patterns',
      ],
      'DATABASE_ERROR': [
        'Check database connection pool configuration',
        'Review slow query logs and optimize queries',
        'Monitor database resource usage',
        'Implement proper database backup and recovery',
        'Consider database connection retry mechanisms',
      ],
      'SECURITY_VIOLATION': [
        'Implement additional security monitoring',
        'Review and update security policies',
        'Consider implementing rate limiting',
        'Set up immediate alerting for security events',
        'Review access logs for suspicious patterns',
      ],
    };

    return suggestions[errorType] || [
      'Review logs for patterns and root causes',
      'Implement monitoring and alerting',
      'Consider adding additional error handling',
      'Document and track error resolution steps',
    ];
  }
}

export const fileProcessor = new FileProcessor();