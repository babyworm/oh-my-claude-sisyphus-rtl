/**
 * Icarus Verilog (iverilog) Simulation Tool
 *
 * Icarus Verilog is a simple, lightweight Verilog simulator.
 * Good for quick simulations and educational purposes.
 *
 * http://iverilog.icarus.com/
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { SimulationTool, ToolInput, CompileResult } from '../types.js';
import type { SimulationResult, ToolResult } from '../../types.js';

const execAsync = promisify(exec);

export class IcarusSim implements SimulationTool {
  private executable?: string;

  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('iverilog -V');
      return stdout.includes('Icarus Verilog');
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('iverilog -V');
      const match = stdout.match(/Icarus Verilog version\s+([\d.]+)/i);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async run(input: ToolInput): Promise<ToolResult> {
    const args = [...(input.args || []), ...input.files];
    const cmd = `iverilog ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        env: { ...process.env, ...input.env },
      });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        errors: [error.message],
      };
    }
  }

  /**
   * Compile Verilog to VVP (Verilog Virtual Processor) format
   *
   * iverilog workflow:
   * 1. iverilog -o design.vvp design.v testbench.v
   * 2. vvp design.vvp
   */
  async compile(files: string[]): Promise<CompileResult> {
    this.executable = 'a.out';

    const compileArgs = [
      '-o', this.executable,
      ...files,
    ];

    const result = await this.run({
      files: [],
      args: compileArgs,
    });

    if (!result.success) {
      return {
        success: false,
        errors: result.errors,
        stderr: result.stderr,
      };
    }

    return {
      success: true,
      executable: this.executable,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  /**
   * Run VVP simulation
   *
   * @param testbench VVP executable (ignored, uses compiled executable)
   * @param args Simulation arguments
   */
  async simulate(testbench: string, args?: string[]): Promise<SimulationResult> {
    if (!this.executable) {
      return {
        success: false,
        passed: false,
        stderr: 'Design not compiled. Call compile() first.',
      };
    }

    const simArgs = args || [];
    const cmd = `vvp ${this.executable} ${simArgs.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 60000,  // 60 second timeout
      });

      // Check for pass/fail in output
      const passed = this.checkSimulationPassed(stdout);

      return {
        success: true,
        passed,
        stdout,
        stderr,
        waveform: 'dump.vcd',  // Default VCD output
      };
    } catch (error: any) {
      return {
        success: false,
        passed: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
      };
    }
  }

  /**
   * Check if simulation passed
   */
  private checkSimulationPassed(output: string): boolean {
    const passPatterns = [
      /test passed/i,
      /all tests passed/i,
      /simulation passed/i,
      /\*\*\* PASS \*\*\*/i,
    ];

    const failPatterns = [
      /test failed/i,
      /error:/i,
      /assertion failed/i,
      /\*\*\* FAIL \*\*\*/i,
    ];

    // Check for explicit failure first
    for (const pattern of failPatterns) {
      if (pattern.test(output)) {
        return false;
      }
    }

    // Check for explicit pass
    for (const pattern of passPatterns) {
      if (pattern.test(output)) {
        return true;
      }
    }

    // If no explicit pass/fail, assume pass if no errors
    return true;
  }
}
