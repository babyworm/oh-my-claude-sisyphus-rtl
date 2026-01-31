/**
 * slang LSP Integration
 *
 * slang is a modern SystemVerilog compiler and language server
 * https://github.com/MikePopoloski/slang
 *
 * Features:
 * - Full IEEE 1800-2017 SystemVerilog support
 * - Fast syntax and semantic analysis
 * - LSP server mode and CLI mode
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import type { LSPClient, Diagnostic, SymbolInformation, Hover } from './index.js';

const execAsync = promisify(exec);

export interface SlangConfig {
  workspaceRoot: string;
  includePaths?: string[];
  defines?: Record<string, string>;
  standard?: '1995' | '2001' | '2005' | '2009' | '2012' | '2017';
  topModule?: string;
}

/**
 * slang LSP Client
 *
 * Currently implements CLI mode for diagnostics.
 * TODO: Implement full LSP protocol for symbols, hover, etc.
 */
export class SlangLSP implements LSPClient {
  readonly type = 'slang' as const;
  private config: SlangConfig;
  private started = false;

  constructor(config: SlangConfig) {
    this.config = {
      standard: '2017',  // Default to SystemVerilog 2017
      ...config,
    };
  }

  async start(): Promise<void> {
    // TODO: Start LSP server process
    // For now, we use CLI mode on-demand
    this.started = true;
  }

  async stop(): Promise<void> {
    // TODO: Stop LSP server process
    this.started = false;
  }

  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('slang --version');
      return stdout.includes('slang');
    } catch {
      return false;
    }
  }

  /**
   * Get diagnostics for a file
   *
   * Uses slang CLI: slang --lint <file>
   */
  async getDiagnostics(filePath: string): Promise<Diagnostic[]> {
    const args = this.buildArgs(filePath);

    try {
      const { stdout, stderr } = await execAsync(`slang ${args.join(' ')}`);
      return this.parseDiagnostics(stdout + stderr, filePath);
    } catch (error: any) {
      // slang exits with non-zero on errors, but still outputs diagnostics
      return this.parseDiagnostics(error.stdout + error.stderr, filePath);
    }
  }

  /**
   * Get document symbols (requires LSP mode)
   * TODO: Implement with full LSP client
   */
  async getDocumentSymbols(filePath: string): Promise<SymbolInformation[]> {
    console.warn('slang getDocumentSymbols not implemented yet (requires LSP mode)');
    return [];
  }

  /**
   * Get hover information (requires LSP mode)
   * TODO: Implement with full LSP client
   */
  async getHover(filePath: string, line: number, column: number): Promise<Hover | null> {
    console.warn('slang getHover not implemented yet (requires LSP mode)');
    return null;
  }

  /**
   * Build slang command arguments
   */
  private buildArgs(filePath: string): string[] {
    const args: string[] = [];

    // Include paths
    if (this.config.includePaths) {
      for (const includePath of this.config.includePaths) {
        args.push('-I', includePath);
      }
    }

    // Defines
    if (this.config.defines) {
      for (const [key, value] of Object.entries(this.config.defines)) {
        args.push('-D', `${key}=${value}`);
      }
    }

    // Standard
    if (this.config.standard) {
      args.push(`--std=${this.config.standard}`);
    }

    // Top module (optional)
    if (this.config.topModule) {
      args.push('--top', this.config.topModule);
    }

    // Lint mode
    args.push('--lint');

    // File
    args.push(filePath);

    return args;
  }

  /**
   * Parse slang output to diagnostics
   *
   * slang output format:
   * file.sv:10:5: error: undeclared identifier 'foo'
   * file.sv:15:10: warning: variable 'bar' is never used
   */
  private parseDiagnostics(output: string, filePath: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/^(.+?):(\d+):(\d+):\s+(error|warning|note):\s+(.+)$/);
      if (!match) continue;

      const [, file, lineStr, columnStr, severity, message] = match;

      diagnostics.push({
        file: file,
        line: parseInt(lineStr, 10),
        column: parseInt(columnStr, 10),
        severity: this.mapSeverity(severity),
        message: message.trim(),
      });
    }

    return diagnostics;
  }

  /**
   * Map slang severity to LSP severity
   */
  private mapSeverity(severity: string): 'error' | 'warning' | 'info' | 'hint' {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'note':
        return 'info';
      default:
        return 'hint';
    }
  }
}

/**
 * Create slang LSP client with auto-detected configuration
 */
export async function createSlangLSP(workspaceRoot: string): Promise<SlangLSP> {
  const {
    scanProjectStructure,
    autoDetectIncludePaths,
    autoDetectDefines,
    loadRTLConfig,
  } = await import('./config-helper.js');

  // Scan project structure
  const structure = await scanProjectStructure(workspaceRoot);

  // Auto-detect include paths
  const includePaths = autoDetectIncludePaths(structure, {
    includeTestbench: false,  // Don't include testbench by default
  });

  // Auto-detect defines
  const defines = await autoDetectDefines(structure);

  // Load RTL config (if exists)
  const rtlConfig = await loadRTLConfig(workspaceRoot);

  const config: SlangConfig = {
    workspaceRoot,
    includePaths,
    defines,
    standard: rtlConfig.standard || '2017',
  };

  return new SlangLSP(config);
}
