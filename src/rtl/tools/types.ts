/**
 * Tool Abstraction Types
 */

import type { ToolResult } from '../types.js';

/**
 * Base tool runner interface
 */
export interface ToolRunner {
  run(input: ToolInput): Promise<ToolResult>;
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string>;
}

/**
 * Tool input
 */
export interface ToolInput {
  files: string[];
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Lint tool interface
 */
export interface LintTool extends ToolRunner {
  lint(files: string[]): Promise<import('../types.js').LintResult>;
}

/**
 * Simulation tool interface
 */
export interface SimulationTool extends ToolRunner {
  compile(files: string[]): Promise<CompileResult>;
  simulate(testbench: string, args?: string[]): Promise<import('../types.js').SimulationResult>;
  collectCoverage?(): Promise<import('../types.js').CoverageResult>;
}

/**
 * Compile result
 */
export interface CompileResult extends ToolResult {
  executable?: string;
}

/**
 * Synthesis tool interface
 */
export interface SynthesisTool extends ToolRunner {
  synthesize(design: string[], constraints: string): Promise<import('../types.js').SynthesisResult>;
  analyzeTiming(netlist: string): Promise<import('../types.js').TimingResult>;
  estimatePPA(netlist: string): Promise<import('../types.js').PPAResult>;
}
