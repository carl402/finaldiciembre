class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send Telegram message:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendErrorAlert(fileName: string, errorCount: number): Promise<void> {
    const message = `
🚨 <b>Critical Errors Detected</b>

📁 <b>File:</b> ${fileName}
🔥 <b>Critical Errors:</b> ${errorCount}
⏰ <b>Time:</b> ${new Date().toLocaleString()}

Please check the Take a Look dashboard for detailed analysis and resolution suggestions.
    `.trim();

    // In a real implementation, you would get all admin users with telegram chat IDs
    // For now, we'll use environment variable for demo
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await this.sendMessage(adminChatId, message);
    }
  }

  async sendDailySummary(stats: any): Promise<void> {
    const message = `
📊 <b>Daily Log Analysis Summary</b>

📁 <b>Files Processed:</b> ${stats.filesProcessed}
🔍 <b>Total Errors:</b> ${stats.totalErrors}
🚨 <b>Critical Errors:</b> ${stats.criticalErrors}
✅ <b>Success Rate:</b> ${stats.successRate.toFixed(1)}%

Top Error Types:
${stats.topErrors.map((error: any) => `• ${error.type}: ${error.count}`).join('\n')}

View detailed reports at: ${process.env.APP_URL || 'your-app-url'}
    `.trim();

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await this.sendMessage(adminChatId, message);
    }
  }

  async testConnection(chatId: string): Promise<boolean> {
    const testMessage = '✅ Telegram integration test successful! You will now receive notifications from Take a Look.';
    return await this.sendMessage(chatId, testMessage);
  }
}

export const telegramService = new TelegramService();