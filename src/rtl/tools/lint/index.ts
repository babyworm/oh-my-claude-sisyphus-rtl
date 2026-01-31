/**
 * Lint Tool Manager
 *
 * Provides unified interface for various lint tools:
 * - verilator (opensource, primary)
 * - verible (opensource, style)
 * - slang (opensource, semantic)
 * - spyglass (commercial, comprehensive)
 */

import type { LintTool } from '../types.js';
import type { LintResult } from '../../types.js';

export class LintManager {
  private tools: Map<string, LintTool>;
  private preferredTool?: string;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a lint tool
   */
  register(name: string, tool: LintTool): void {
    this.tools.set(name, tool);
  }

  /**
   * Set preferred tool
   */
  setPreferred(name: string): void {
    if (!this.tools.has(name)) {
      throw new Error(`Lint tool '${name}' not registered`);
    }
    this.preferredTool = name;
  }

  /**
   * Detect installed lint tools
   */
  async detectInstalledTools(): Promise<string[]> {
    const installed: string[] = [];

    for (const [name, tool] of this.tools) {
      try {
        if (await tool.isInstalled()) {
          installed.push(name);
        }
      } catch (error) {
        console.warn(`Failed to check if ${name} is installed: ${error}`);
      }
    }

    return installed;
  }

  /**
   * Run lint on files
   *
   * @param files Files to lint
   * @param preferredTool Override preferred tool for this run
   */
  async lint(files: string[], preferredTool?: string): Promise<LintResult> {
    const tool = await this.selectTool(preferredTool);

    if (!tool) {
      return {
        success: false,
        warnings: [],
        lintErrors: [],
        stderr: 'No lint tool available',
      };
    }

    try {
      return await tool.lint(files);
    } catch (error: any) {
      return {
        success: false,
        warnings: [],
        lintErrors: [],
        stderr: error.message,
      };
    }
  }

  /**
   * Select appropriate lint tool
   *
   * Priority:
   * 1. User-specified preferred tool
   * 2. Manager's preferred tool
   * 3. First installed tool
   */
  private async selectTool(preferred?: string): Promise<LintTool | null> {
    // User override
    if (preferred && this.tools.has(preferred)) {
      const tool = this.tools.get(preferred)!;
      if (await tool.isInstalled()) {
        return tool;
      }
    }

    // Manager's preferred
    if (this.preferredTool && this.tools.has(this.preferredTool)) {
      const tool = this.tools.get(this.preferredTool)!;
      if (await tool.isInstalled()) {
        return tool;
      }
    }

    // First installed
    for (const [name, tool] of this.tools) {
      if (await tool.isInstalled()) {
        return tool;
      }
    }

    return null;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Create default lint manager with all supported tools
 */
export async function createLintManager(): Promise<LintManager> {
  const manager = new LintManager();

  // Dynamically import tools to avoid loading unused dependencies
  try {
    const { VerilatorLint } = await import('./verilator.js');
    manager.register('verilator', new VerilatorLint());
  } catch (error) {
    console.warn('Failed to load verilator lint:', error);
  }

  try {
    const { VeribleLint } = await import('./verible.js');
    manager.register('verible', new VeribleLint());
  } catch (error) {
    console.warn('Failed to load verible lint:', error);
  }

  try {
    const { SlangLint } = await import('./slang.js');
    manager.register('slang', new SlangLint());
  } catch (error) {
    console.warn('Failed to load slang lint:', error);
  }

  // Set default preference: verilator (most widely used)
  const installed = await manager.detectInstalledTools();
  if (installed.includes('verilator')) {
    manager.setPreferred('verilator');
  } else if (installed.includes('slang')) {
    manager.setPreferred('slang');
  } else if (installed.includes('verible')) {
    manager.setPreferred('verible');
  }

  return manager;
}
