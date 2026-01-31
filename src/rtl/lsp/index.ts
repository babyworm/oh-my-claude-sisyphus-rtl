/**
 * LSP (Language Server Protocol) Integration
 *
 * Supports:
 * - slang (Primary - SystemVerilog)
 * - verible (Fallback)
 * - svls (Fallback)
 *
 * Auto-detects installed LSP and provides graceful degradation.
 */

import type { ToolConfig, ToolResult } from '../types.js';

// Note: config-helper exports are not re-exported here to avoid conflicts
// Import them directly from './lsp/config-helper.js' if needed

/**
 * Supported LSP types
 */
export type LSPType = 'slang' | 'verible' | 'svls' | 'none';

/**
 * LSP client interface
 */
export interface LSPClient {
  readonly type: LSPType;
  start(): Promise<void>;
  stop(): Promise<void>;
  isInstalled(): Promise<boolean>;
  getDiagnostics(filePath: string): Promise<Diagnostic[]>;
  getDocumentSymbols?(filePath: string): Promise<SymbolInformation[]>;
  getHover?(filePath: string, line: number, column: number): Promise<Hover | null>;
}

/**
 * Diagnostic (LSP)
 */
export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  code?: string;
}

/**
 * Symbol information (LSP)
 */
export interface SymbolInformation {
  name: string;
  kind: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * Hover information (LSP)
 */
export interface Hover {
  contents: string;
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Detect installed LSP
 *
 * Priority: slang > verible > svls > none
 */
export async function detectLSP(): Promise<LSPType> {
  const { createSlangLSP } = await import('./slang.js');
  const { createVeribleLSP } = await import('./verible.js');
  const { createSvlsLSP } = await import('./svls.js');

  // Try slang first (primary)
  try {
    const slang = await createSlangLSP(process.cwd());
    if (await slang.isInstalled()) {
      return 'slang';
    }
  } catch {
    // Continue to next option
  }

  // Try verible (fallback 1)
  try {
    const verible = await createVeribleLSP(process.cwd());
    if (await verible.isInstalled()) {
      return 'verible';
    }
  } catch {
    // Continue to next option
  }

  // Try svls (fallback 2)
  try {
    const svls = await createSvlsLSP(process.cwd());
    if (await svls.isInstalled()) {
      return 'svls';
    }
  } catch {
    // Fall through to none
  }

  return 'none';
}

/**
 * Create LSP client
 */
export async function createLSPClient(workspaceRoot?: string, type?: LSPType): Promise<LSPClient> {
  const root = workspaceRoot || process.cwd();
  const lspType = type || await detectLSP();

  switch (lspType) {
    case 'slang': {
      const { createSlangLSP } = await import('./slang.js');
      return createSlangLSP(root);
    }
    case 'verible': {
      const { createVeribleLSP } = await import('./verible.js');
      return createVeribleLSP(root);
    }
    case 'svls': {
      const { createSvlsLSP } = await import('./svls.js');
      return createSvlsLSP(root);
    }
    default:
      return new NoOpLSP();
  }
}

/**
 * No-op LSP client (graceful degradation)
 */
class NoOpLSP implements LSPClient {
  readonly type: LSPType = 'none';
  
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async isInstalled(): Promise<boolean> { return false; }
  async getDiagnostics(): Promise<Diagnostic[]> { return []; }
}
