/**
 * Verible LSP Integration
 *
 * Verible is a SystemVerilog parser, linter, and formatter
 * https://github.com/chipsalliance/verible
 *
 * Features:
 * - Style linting (verible-verilog-lint)
 * - LSP server (verible-verilog-ls)
 * - Formatting (verible-verilog-format)
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { LSPClient, Diagnostic, SymbolInformation, Hover } from './index.js';

const execAsync = promisify(exec);

export interface VeribleConfig {
  workspaceRoot: string;
  rules?: string;  // Path to rules file
  ruleset?: 'default' | 'relaxed' | 'strict';
}

/**
 * Verible LSP Client
 *
 * Currently implements CLI mode for linting.
 * TODO: Implement full LSP protocol using verible-verilog-ls
 */
export class VeribleLSP implements LSPClient {
  readonly type = 'verible' as const;
  private config: VeribleConfig;
  private started = false;

  constructor(config: VeribleConfig) {
    this.config = {
      ruleset: 'default',
      ...config,
    };
  }

  async start(): Promise<void> {
    // TODO: Start verible-verilog-ls process
    this.started = true;
  }

  async stop(): Promise<void> {
    // TODO: Stop verible-verilog-ls process
    this.started = false;
  }

  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('verible-verilog-lint --version');
      return stdout.includes('verible');
    } catch {
      return false;
    }
  }

  /**
   * Get diagnostics for a file
   *
   * Uses verible-verilog-lint CLI
   */
  async getDiagnostics(filePath: string): Promise<Diagnostic[]> {
    const args = this.buildArgs(filePath);

    try {
      const { stdout, stderr } = await execAsync(`verible-verilog-lint ${args.join(' ')}`);
      return this.parseDiagnostics(stdout + stderr, filePath);
    } catch (error: any) {
      // verible-verilog-lint exits with non-zero on violations
      return this.parseDiagnostics(error.stdout + error.stderr, filePath);
    }
  }

  /**
   * Get document symbols (requires LSP mode)
   * TODO: Implement with verible-verilog-ls
   */
  async getDocumentSymbols(filePath: string): Promise<SymbolInformation[]> {
    console.warn('verible getDocumentSymbols not implemented yet (requires LSP mode)');
    return [];
  }

  /**
   * Get hover information (requires LSP mode)
   * TODO: Implement with verible-verilog-ls
   */
  async getHover(filePath: string, line: number, column: number): Promise<Hover | null> {
    console.warn('verible getHover not implemented yet (requires LSP mode)');
    return null;
  }

  /**
   * Build verible-verilog-lint arguments
   */
  private buildArgs(filePath: string): string[] {
    const args: string[] = [];

    // Rules file
    if (this.config.rules) {
      args.push('--rules_config', this.config.rules);
    }

    // Ruleset
    if (this.config.ruleset === 'relaxed') {
      args.push('--ruleset', 'relaxed');
    } else if (this.config.ruleset === 'strict') {
      args.push('--ruleset', 'strict');
    }

    // File
    args.push(filePath);

    return args;
  }

  /**
   * Parse verible-verilog-lint output
   *
   * Format:
   * file.sv:10:5: error: [rule-name] message
   */
  private parseDiagnostics(output: string, filePath: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/^(.+?):(\d+):(\d+):\s+(\w+):\s+\[(.+?)\]\s+(.+)$/);
      if (!match) continue;

      const [, file, lineStr, columnStr, severity, code, message] = match;

      diagnostics.push({
        file: file,
        line: parseInt(lineStr, 10),
        column: parseInt(columnStr, 10),
        severity: this.mapSeverity(severity),
        message: message.trim(),
        code,
      });
    }

    return diagnostics;
  }

  /**
   * Map verible severity to LSP severity
   */
  private mapSeverity(severity: string): 'error' | 'warning' | 'info' | 'hint' {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'hint';
    }
  }
}

/**
 * Create Verible LSP client
 */
export async function createVeribleLSP(workspaceRoot: string): Promise<VeribleLSP> {
  // TODO: Auto-detect verible configuration
  // - Scan for .verible-lint.json or .rules.verible_lint

  const config: VeribleConfig = {
    workspaceRoot,
    ruleset: 'default',
  };

  return new VeribleLSP(config);
}
