/**
 * svls (SystemVerilog Language Server) Integration
 *
 * svls is a lightweight SystemVerilog language server written in Rust
 * https://github.com/dalance/svls
 *
 * Features:
 * - Fast parsing
 * - Document symbols
 * - Go to definition
 * - Hover information
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { LSPClient, Diagnostic, SymbolInformation, Hover } from './index.js';

const execAsync = promisify(exec);

export interface SvlsConfig {
  workspaceRoot: string;
  includePaths?: string[];
}

/**
 * svls LSP Client
 *
 * svls primarily works in LSP mode.
 * For CLI diagnostics, use slang or verible.
 */
export class SvlsLSP implements LSPClient {
  readonly type = 'svls' as const;
  private config: SvlsConfig;
  private started = false;

  constructor(config: SvlsConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    // TODO: Start svls process via LSP protocol
    this.started = true;
  }

  async stop(): Promise<void> {
    // TODO: Stop svls process
    this.started = false;
  }

  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('svls --version');
      return stdout.includes('svls');
    } catch {
      return false;
    }
  }

  /**
   * Get diagnostics (requires LSP mode)
   *
   * svls doesn't have a dedicated lint CLI, so diagnostics
   * must come from the LSP server.
   */
  async getDiagnostics(filePath: string): Promise<Diagnostic[]> {
    console.warn('svls getDiagnostics requires LSP mode (not implemented yet)');
    return [];
  }

  /**
   * Get document symbols (requires LSP mode)
   */
  async getDocumentSymbols(filePath: string): Promise<SymbolInformation[]> {
    console.warn('svls getDocumentSymbols not implemented yet (requires LSP mode)');
    return [];
  }

  /**
   * Get hover information (requires LSP mode)
   */
  async getHover(filePath: string, line: number, column: number): Promise<Hover | null> {
    console.warn('svls getHover not implemented yet (requires LSP mode)');
    return null;
  }
}

/**
 * Create svls LSP client
 */
export async function createSvlsLSP(workspaceRoot: string): Promise<SvlsLSP> {
  const config: SvlsConfig = {
    workspaceRoot,
    includePaths: [
      `${workspaceRoot}/src`,
      `${workspaceRoot}/include`,
      `${workspaceRoot}/rtl`,
    ],
  };

  return new SvlsLSP(config);
}
