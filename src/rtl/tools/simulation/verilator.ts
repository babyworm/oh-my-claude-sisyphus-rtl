/**
 * Verilator Simulation Tool
 *
 * Verilator converts Verilog/SystemVerilog to C++/SystemC for fast simulation.
 * Excellent for cycle-accurate simulation and regression testing.
 *
 * https://www.veripool.org/verilator/
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import * as path from 'path';
import type { SimulationTool, ToolInput, CompileResult } from '../types.js';
import type { SimulationResult, CoverageResult, ToolResult } from '../../types.js';

const execAsync = promisify(exec);

export class VerilatorSim implements SimulationTool {
  private executable?: string;

  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('verilator --version');
      return stdout.includes('Verilator');
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('verilator --version');
      const match = stdout.match(/Verilator\s+([\d.]+)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async run(input: ToolInput): Promise<ToolResult> {
    const args = [...(input.args || []), ...input.files];
    const cmd = `verilator ${args.join(' ')}`;

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
   * Compile Verilog/SystemVerilog to C++ executable
   *
   * Verilator workflow:
   * 1. verilator --cc design.sv --exe testbench.cpp
   * 2. make -C obj_dir -f Vdesign.mk
   * 3. obj_dir/Vdesign
   */
  async compile(files: string[]): Promise<CompileResult> {
    // Determine top module name from first file
    const topFile = files[0];
    const topModule = path.basename(topFile, path.extname(topFile));

    // Verilate to C++
    const verilateArgs = [
      '--cc',                    // Convert to C++
      '--build',                 // Build executable
      '--exe',                   // Include executable generation
      '--Wall',                  // All warnings
      '--trace',                 // Enable waveform tracing (VCD)
      '--coverage',              // Enable coverage
      ...files,
    ];

    const result = await this.run({
      files: [],
      args: verilateArgs,
    });

    if (!result.success) {
      return {
        success: false,
        errors: result.errors,
        stderr: result.stderr,
      };
    }

    // Executable path: obj_dir/V{topModule}
    this.executable = `obj_dir/V${topModule}`;

    return {
      success: true,
      executable: this.executable,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  /**
   * Run simulation
   *
   * @param testbench Testbench executable (ignored for Verilator, uses compiled executable)
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
    const cmd = `${this.executable} ${simArgs.join(' ')}`;

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
   * Collect coverage data
   *
   * Verilator generates coverage.dat file
   */
  async collectCoverage(): Promise<CoverageResult> {
    // TODO: Parse coverage.dat file
    // verilator_coverage --annotate annotated coverage.dat

    return {
      line: 0,
      toggle: 0,
      fsm: 0,
    };
  }

  /**
   * Check if simulation passed
   *
   * Looks for common pass/fail indicators in output
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
