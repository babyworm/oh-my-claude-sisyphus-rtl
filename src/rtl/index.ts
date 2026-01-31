/**
 * oh-my-claude-rtl - RTL Module Entry Point
 * 
 * This module provides RTL development functionality including:
 * - LSP integration (slang, verible, svls)
 * - Tool abstraction (lint, simulation, synthesis)
 * - Verification helpers (UVM, cocotb, coverage)
 * - Workflow orchestration
 */

export * from './types.js';
export * from './lsp/index.js';
export * from './tools/index.js';
export * from './verification/index.js';
export * from './workflow/index.js';
export * from './config/index.js';

/**
 * RTL Module Version
 */
export const RTL_VERSION = '0.1.0';

/**
 * Check if RTL environment is properly set up
 *
 * Returns detected tools for each category
 */
export async function checkRTLEnvironment(): Promise<{
  lsp: string[];
  lint: string[];
  simulation: string[];
  synthesis: string[];
}> {
  const { detectLSP } = await import('./lsp/index.js');
  const { createLintManager } = await import('./tools/lint/index.js');
  const { createSimulationManager } = await import('./tools/simulation/index.js');
  const { createSynthesisManager } = await import('./tools/synthesis/index.js');

  // Detect LSP
  const lspType = await detectLSP();
  const lsp = lspType === 'none' ? [] : [lspType];

  // Detect lint tools
  const lintManager = await createLintManager();
  const lint = await lintManager.detectInstalledTools();

  // Detect simulation tools
  const simManager = await createSimulationManager();
  const simulation = await simManager.detectInstalledTools();

  // Detect synthesis tools
  const synthManager = await createSynthesisManager();
  const synthesis = await synthManager.detectInstalledTools();

  return {
    lsp,
    lint,
    simulation,
    synthesis,
  };
}
