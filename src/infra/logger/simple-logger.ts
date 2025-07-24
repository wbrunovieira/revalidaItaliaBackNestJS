import * as fs from 'fs';
import * as path from 'path';

interface LogContext {
  endpoint?: string;
  userId?: string;
  method?: string;
  payload?: any;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  traceId: string;
  level: 'ERROR' | 'INFO' | 'WARN' | 'DEBUG';
  message: string;
  error?: {
    message: string;
    stack?: string;
    type?: string;
  };
  context?: LogContext;
}

export class SimpleLogger {
  private static logDir = path.join(process.cwd(), 'logs');
  private static initialized = false;

  static init() {
    if (this.initialized) return;

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.initialized = true;
  }

  static generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static logError(traceId: string, error: any, context?: LogContext): void {
    this.init();

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      traceId,
      level: 'ERROR',
      message: error.message || 'Unknown error',
      error: {
        message: error.message || String(error),
        stack: error.stack,
        type: error.constructor?.name || 'Error',
      },
      context: this.sanitizeContext(context),
    };

    // Console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n🔴 ERROR:', {
        traceId,
        message: error.message,
        context: context?.endpoint,
      });
    }

    // Arquivo de erros por dia
    const errorFile = path.join(
      this.logDir,
      `errors-${this.getDateString()}.log`,
    );
    fs.appendFileSync(errorFile, JSON.stringify(logEntry) + '\n');

    // Também no log geral
    const logFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static logInfo(message: string, context?: LogContext): void {
    this.init();

    const logEntry: Omit<LogEntry, 'error'> = {
      timestamp: new Date().toISOString(),
      traceId: context?.traceId || this.generateTraceId(),
      level: 'INFO',
      message,
      context: this.sanitizeContext(context),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`ℹ️  ${message}`);
    }

    const logFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static logWarn(message: string, context?: LogContext): void {
    this.init();

    const logEntry: Omit<LogEntry, 'error'> = {
      timestamp: new Date().toISOString(),
      traceId: context?.traceId || this.generateTraceId(),
      level: 'WARN',
      message,
      context: this.sanitizeContext(context),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  ${message}`);
    }

    const logFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static logDebug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'production') return;

    this.init();

    const logEntry: Omit<LogEntry, 'error'> = {
      timestamp: new Date().toISOString(),
      traceId: context?.traceId || this.generateTraceId(),
      level: 'DEBUG',
      message,
      context: this.sanitizeContext(context),
    };

    console.log(`🐛 ${message}`);

    const logFile = path.join(this.logDir, `debug-${this.getDateString()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Remover dados sensíveis do contexto
  private static sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Remover senha se existir
    if (sanitized.payload?.password) {
      sanitized.payload = {
        ...sanitized.payload,
        password: '[REDACTED]',
      };
    }

    // Remover tokens
    if (sanitized.payload?.token) {
      sanitized.payload = {
        ...sanitized.payload,
        token: '[REDACTED]',
      };
    }

    return sanitized;
  }

  private static getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Método auxiliar para ler logs por traceId (útil para debugging)
  static async findByTraceId(traceId: string): Promise<LogEntry[]> {
    this.init();

    const entries: LogEntry[] = [];
    const files = fs.readdirSync(this.logDir);

    for (const file of files) {
      if (file.endsWith('.log')) {
        const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.traceId === traceId) {
              entries.push(entry);
            }
          } catch (e) {
            // Ignorar linhas mal formatadas
          }
        }
      }
    }

    return entries.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }
}
