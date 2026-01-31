/**
 * slang Lint Tool
 *
 * slang provides comprehensive SystemVerilog semantic analysis.
 * Catches more subtle issues than Verilator.
 *
 * https://github.com/MikePopoloski/slang
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import type { LintTool, ToolInput } from '../types.js';
import type { LintResult, LintWarning, LintError, ToolResult } from '../../types.js';

const execAsync = promisify(exec);

export class SlangLint implements LintTool {
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('slang --version');
      return stdout.includes('slang');
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('slang --version');
      const match = stdout.match(/slang\s+version\s+([\d.]+)/i);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async run(input: ToolInput): Promise<ToolResult> {
    const args = ['--lint', ...(input.args || []), ...input.files];
    const cmd = `slang ${args.join(' ')}`;

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
        errors: error.stderr ? [error.stderr] : [],
      };
    }
  }

  async lint(files: string[]): Promise<LintResult> {
    const result = await this.run({
      files,
      args: ['--lint'],
    });

    return this.parseLintOutput(result);
  }

  /**
   * Parse slang lint output
   *
   * Format:
   * file.sv:10:5: error: undeclared identifier 'foo'
   * file.sv:15:10: warning: variable 'bar' is never used
   */
  private parseLintOutput(result: ToolResult): LintResult {
    const warnings: LintWarning[] = [];
    const errors: LintError[] = [];

    const output = (result.stdout || '') + (result.stderr || '');
    const lines = output.split('\n');

    for (const line of lines) {
      // Match slang message format
      const match = line.match(/^(.+?):(\d+):(\d+):\s+(error|warning|note):\s+(.+)$/);
      if (!match) continue;

      const [, file, lineStr, columnStr, severity, message] = match;
      const lineNum = parseInt(lineStr, 10);
      const column = parseInt(columnStr, 10);

      if (severity === 'error') {
        errors.push({
          file,
          line: lineNum,
          column,
          code: 'slang',
          message: message.trim(),
          severity: 'error',
        });
      } else {
        warnings.push({
          file,
          line: lineNum,
          column,
          code: 'slang',
          message: message.trim(),
          severity: severity === 'warning' ? 'warning' : 'info',
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
