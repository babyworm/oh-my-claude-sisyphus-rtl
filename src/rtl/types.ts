/**
 * RTL Common Types
 */

/**
 * Supported RTL languages
 */
export type RTLLanguage = 'verilog' | 'systemverilog' | 'vhdl' | 'chisel' | 'spinalhdl' | 'systemc';

/**
 * Tool types
 */
export type ToolType = 'opensource' | 'commercial';

/**
 * Tool categories
 */
export type ToolCategory = 'lsp' | 'lint' | 'simulation' | 'synthesis' | 'coverage' | 'waveform';

/**
 * Tool configuration
 */
export interface ToolConfig {
  type: ToolType;
  name: string;
  executable: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Tool result base
 */
export interface ToolResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  errors?: string[];
}

/**
 * File pattern
 */
export interface FilePattern {
  include?: string[];
  exclude?: string[];
}

/**
 * RTL project configuration
 */
export interface RTLProjectConfig {
  language: RTLLanguage;
  tools: {
    lsp?: {
      preferred: string;
      fallback?: string[];
    };
    lint?: {
      preferred: string;
      rules?: string;
      ignore?: string[];
    };
    simulation?: {
      preferred: string;
      fallback?: string;
      coverage?: {
        enabled: boolean;
        types?: string[];
      };
    };
    synthesis?: {
      preferred: string;
      fallback?: string;
      target?: {
        technology: string;
        clock: string;
      };
    };
  };
  paths: {
    rtl: string;
    testbench: string;
    synthesis: string;
    reports: string;
  };
}

/**
 * Lint result
 */
export interface LintResult extends ToolResult {
  warnings: LintWarning[];
  lintErrors: LintError[];  // Renamed to avoid conflict with ToolResult.errors
}

/**
 * Lint warning
 */
export interface LintWarning {
  file: string;
  line: number;
  column?: number;
  code: string;
  message: string;
  severity: 'warning' | 'info';
}

/**
 * Lint error
 */
export interface LintError {
  file: string;
  line: number;
  column?: number;
  code: string;
  message: string;
  severity: 'error';
}

/**
 * Simulation result
 */
export interface SimulationResult extends ToolResult {
  passed: boolean;
  coverage?: CoverageResult;
  waveform?: string;  // Path to waveform file
}

/**
 * Coverage result
 */
export interface CoverageResult {
  line: number;
  toggle: number;
  fsm: number;
  functional?: number;
}

/**
 * Synthesis result
 */
export interface SynthesisResult extends ToolResult {
  netlist?: string;  // Path to netlist
  timing?: TimingResult;
  ppa?: PPAResult;
}

/**
 * Timing result
 */
export interface TimingResult {
  criticalPath: {
    start: string;
    end: string;
    delay: number;  // ns
  };
  slack: number;  // ns
  frequency: number;  // MHz
}

/**
 * PPA result
 */
export interface PPAResult {
  area: {
    cells: number;
    area: number;  // μm²
  };
  power: {
    dynamic: number;  // mW
    static: number;   // mW
    total: number;    // mW
  };
  performance: {
    frequency: number;  // MHz
  };
}
