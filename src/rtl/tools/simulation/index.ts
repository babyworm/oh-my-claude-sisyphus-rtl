/**
 * Simulation Tool Manager
 *
 * Provides unified interface for various simulation tools:
 * - verilator (opensource, fast C++ sim)
 * - iverilog (opensource, simple)
 * - xrun (commercial, Cadence)
 * - vcs (commercial, Synopsys)
 * - questa (commercial, Siemens/Mentor)
 */

import type { SimulationTool } from '../types.js';
import type { SimulationResult } from '../../types.js';

export class SimulationManager {
  private tools: Map<string, SimulationTool>;
  private preferredTool?: string;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a simulation tool
   */
  register(name: string, tool: SimulationTool): void {
    this.tools.set(name, tool);
  }

  /**
   * Set preferred tool
   */
  setPreferred(name: string): void {
    if (!this.tools.has(name)) {
      throw new Error(`Simulation tool '${name}' not registered`);
    }
    this.preferredTool = name;
  }

  /**
   * Detect installed simulation tools
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
   * Compile and simulate design
   *
   * @param files Design files to compile
   * @param testbench Testbench file
   * @param args Additional simulation arguments
   * @param preferredTool Override preferred tool for this run
   */
  async simulate(
    files: string[],
    testbench: string,
    args?: string[],
    preferredTool?: string
  ): Promise<SimulationResult> {
    const tool = await this.selectTool(preferredTool);

    if (!tool) {
      return {
        success: false,
        passed: false,
        stderr: 'No simulation tool available',
      };
    }

    try {
      // Compile design
      const compileResult = await tool.compile(files);
      if (!compileResult.success) {
        return {
          success: false,
          passed: false,
          errors: compileResult.errors,
          stderr: compileResult.stderr,
        };
      }

      // Run simulation
      const simResult = await tool.simulate(testbench, args);

      // Collect coverage if supported
      if (tool.collectCoverage && simResult.success) {
        try {
          simResult.coverage = await tool.collectCoverage();
        } catch (error) {
          console.warn('Failed to collect coverage:', error);
        }
      }

      return simResult;
    } catch (error: any) {
      return {
        success: false,
        passed: false,
        stderr: error.message,
      };
    }
  }

  /**
   * Select appropriate simulation tool
   */
  private async selectTool(preferred?: string): Promise<SimulationTool | null> {
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
 * Create default simulation manager with all supported tools
 */
export async function createSimulationManager(): Promise<SimulationManager> {
  const manager = new SimulationManager();

  // Load opensource tools
  try {
    const { VerilatorSim } = await import('./verilator.js');
    manager.register('verilator', new VerilatorSim());
  } catch (error) {
    console.warn('Failed to load verilator sim:', error);
  }

  try {
    const { IcarusSim } = await import('./iverilog.js');
    manager.register('iverilog', new IcarusSim());
  } catch (error) {
    console.warn('Failed to load iverilog sim:', error);
  }

  // Set default preference
  const installed = await manager.detectInstalledTools();
  if (installed.includes('verilator')) {
    manager.setPreferred('verilator');
  } else if (installed.includes('iverilog')) {
    manager.setPreferred('iverilog');
  }

  return manager;
}
