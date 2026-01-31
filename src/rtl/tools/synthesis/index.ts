/**
 * Synthesis Tool Manager
 *
 * Provides unified interface for various synthesis tools:
 * - yosys (opensource)
 * - design compiler (commercial, Synopsys)
 * - genus (commercial, Cadence)
 */

import type { SynthesisTool } from '../types.js';
import type { SynthesisResult } from '../../types.js';

export class SynthesisManager {
  private tools: Map<string, SynthesisTool>;
  private preferredTool?: string;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a synthesis tool
   */
  register(name: string, tool: SynthesisTool): void {
    this.tools.set(name, tool);
  }

  /**
   * Set preferred tool
   */
  setPreferred(name: string): void {
    if (!this.tools.has(name)) {
      throw new Error(`Synthesis tool '${name}' not registered`);
    }
    this.preferredTool = name;
  }

  /**
   * Detect installed synthesis tools
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
   * Synthesize design
   *
   * @param design RTL design files
   * @param constraints Synthesis constraints (SDC, TCL, etc.)
   * @param preferredTool Override preferred tool for this run
   */
  async synthesize(
    design: string[],
    constraints: string,
    preferredTool?: string
  ): Promise<SynthesisResult> {
    const tool = await this.selectTool(preferredTool);

    if (!tool) {
      return {
        success: false,
        stderr: 'No synthesis tool available',
      };
    }

    try {
      const result = await tool.synthesize(design, constraints);

      // Analyze timing if synthesis succeeded
      if (result.success && result.netlist) {
        try {
          result.timing = await tool.analyzeTiming(result.netlist);
          result.ppa = await tool.estimatePPA(result.netlist);
        } catch (error) {
          console.warn('Failed to analyze timing/PPA:', error);
        }
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        stderr: error.message,
      };
    }
  }

  /**
   * Select appropriate synthesis tool
   */
  private async selectTool(preferred?: string): Promise<SynthesisTool | null> {
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
 * Create default synthesis manager with all supported tools
 */
export async function createSynthesisManager(): Promise<SynthesisManager> {
  const manager = new SynthesisManager();

  // Load opensource tools
  try {
    const { YosysSynth } = await import('./yosys.js');
    manager.register('yosys', new YosysSynth());
  } catch (error) {
    console.warn('Failed to load yosys:', error);
  }

  // Set default preference
  const installed = await manager.detectInstalledTools();
  if (installed.includes('yosys')) {
    manager.setPreferred('yosys');
  }

  return manager;
}
