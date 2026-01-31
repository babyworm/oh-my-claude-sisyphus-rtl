/**
 * Verible Lint Tool
 *
 * Verible focuses on style and coding standards rather than semantic analysis.
 * Excellent for enforcing consistent coding style across teams.
 *
 * https://github.com/chipsalliance/verible
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { LintTool, ToolInput } from '../types.js';
import type { LintResult, LintWarning, LintError, ToolResult } from '../../types.js';

const execAsync = promisify(exec);

export class VeribleLint implements LintTool {
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('verible-verilog-lint --version');
      return stdout.includes('verible');
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('verible-verilog-lint --version');
      const match = stdout.match(/verible-verilog-lint\s+([\w.-]+)/i);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async run(input: ToolInput): Promise<ToolResult> {
    const args = [...(input.args || []), ...input.files];
    const cmd = `verible-verilog-lint ${args.join(' ')}`;

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
      // verible-verilog-lint returns non-zero on violations
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        errors: error.stderr ? [error.stderr] : [],
      };
    }
  }

  async lint(files: string[]): Promise<LintResult> {
    const result = await this.run({
      files,
      args: [],
    });

    return this.parseLintOutput(result);
  }

  /**
   * Parse Verible lint output
   *
   * Format:
   * file.sv:10:5: Line length exceeds max: 100 characters [line-length]
   * file.sv:15:1: Multiple statements on one line [one-statement-per-line]
   */
  private parseLintOutput(result: ToolResult): LintResult {
    const warnings: LintWarning[] = [];
    const errors: LintError[] = [];

    const output = (result.stdout || '') + (result.stderr || '');
    const lines = output.split('\n');

    for (const line of lines) {
      // Match Verible message format
      const match = line.match(/^(.+?):(\d+):(\d+):\s+(.+?)\s+\[(.+?)\]$/);
      if (!match) continue;

      const [, file, lineStr, columnStr, message, code] = match;
      const lineNum = parseInt(lineStr, 10);
      const column = parseInt(columnStr, 10);

      // Verible primarily reports style warnings
      // Treat all as warnings unless the message suggests otherwise
      const isError = message.toLowerCase().includes('error');

      if (isError) {
        errors.push({
          file,
          line: lineNum,
          column,
          code,
          message: message.trim(),
          severity: 'error',
        });
      } else {
        warnings.push({
          file,
          line: lineNum,
          column,
          code,
          message: message.trim(),
          severity: 'warning',
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
