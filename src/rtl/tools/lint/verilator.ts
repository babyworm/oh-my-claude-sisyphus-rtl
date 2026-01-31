/**
 * Verilator Lint Tool
 *
 * Verilator is a fast open-source Verilog/SystemVerilog simulator
 * that also provides excellent lint capabilities.
 *
 * https://www.veripool.org/verilator/
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { LintTool, ToolInput } from '../types.js';
import type { LintResult, LintWarning, LintError, ToolResult } from '../../types.js';

const execAsync = promisify(exec);

export class VerilatorLint implements LintTool {
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
    const args = ['--lint-only', ...(input.args || []), ...input.files];
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

  async lint(files: string[]): Promise<LintResult> {
    const result = await this.run({
      files,
      args: ['--lint-only', '--Wall'],
    });

    return this.parseLintOutput(result);
  }

  /**
   * Parse Verilator lint output
   *
   * Format examples:
   * %Warning-WIDTH: file.sv:10:5: Operator ASSIGN expects 32 bits on the Assign RHS, but Assign RHS's CONST '1'h1' generates 1 bits.
   * %Error-HIERBLOCK: file.sv:15:10: Cannot find definition for module: 'nonexistent_module'
   */
  private parseLintOutput(result: ToolResult): LintResult {
    const warnings: LintWarning[] = [];
    const errors: LintError[] = [];

    const output = (result.stdout || '') + (result.stderr || '');
    const lines = output.split('\n');

    for (const line of lines) {
      // Match Verilator message format
      const match = line.match(/^%(Warning|Error)-(\w+):\s+(.+?):(\d+):(\d+):\s+(.+)$/);
      if (!match) continue;

      const [, severity, code, file, lineStr, columnStr, message] = match;
      const lineNum = parseInt(lineStr, 10);
      const column = parseInt(columnStr, 10);

      if (severity === 'Warning') {
        warnings.push({
          file,
          line: lineNum,
          column,
          code,
          message: message.trim(),
          severity: 'warning',
        });
      } else {
        errors.push({
          file,
          line: lineNum,
          column,
          code,
          message: message.trim(),
          severity: 'error',
        });
      }
    }

    return {
      success: errors.length === 0,
      warnings,
      lintErrors: errors,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
}
