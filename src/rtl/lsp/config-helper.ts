/**
 * LSP Configuration Auto-Detection Helper
 *
 * Helps detect include paths, defines, and other configuration
 * from RTL project structure.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectStructure {
  root: string;
  rtlDirs: string[];
  includeDirs: string[];
  testbenchDirs: string[];
  configFiles: string[];
}

/**
 * Scan project structure to find RTL-related directories
 */
export async function scanProjectStructure(workspaceRoot: string): Promise<ProjectStructure> {
  const structure: ProjectStructure = {
    root: workspaceRoot,
    rtlDirs: [],
    includeDirs: [],
    testbenchDirs: [],
    configFiles: [],
  };

  // Common RTL directory patterns
  const rtlPatterns = ['src', 'rtl', 'hdl', 'design', 'verilog', 'sv'];
  const includePatterns = ['include', 'includes', 'inc'];
  const testbenchPatterns = ['tb', 'testbench', 'test', 'sim'];

  // Scan for directories
  try {
    const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name.toLowerCase();
      const fullPath = path.join(workspaceRoot, entry.name);

      // Check for RTL directories
      if (rtlPatterns.some(pattern => dirName.includes(pattern))) {
        structure.rtlDirs.push(fullPath);
      }

      // Check for include directories
      if (includePatterns.some(pattern => dirName.includes(pattern))) {
        structure.includeDirs.push(fullPath);
      }

      // Check for testbench directories
      if (testbenchPatterns.some(pattern => dirName.includes(pattern))) {
        structure.testbenchDirs.push(fullPath);
      }
    }

    // Scan for config files
    structure.configFiles = await findConfigFiles(workspaceRoot);
  } catch (error) {
    console.warn(`Failed to scan project structure: ${error}`);
  }

  return structure;
}

/**
 * Find RTL configuration files
 *
 * Looks for:
 * - .rtl-config.json
 * - slang.json
 * - .verible-lint.json
 * - rtl.config.js
 */
async function findConfigFiles(workspaceRoot: string): Promise<string[]> {
  const configPatterns = [
    '.rtl-config.json',
    'slang.json',
    '.slang.json',
    '.verible-lint.json',
    'rtl.config.js',
    'rtl.config.json',
  ];

  const found: string[] = [];

  for (const pattern of configPatterns) {
    const filePath = path.join(workspaceRoot, pattern);
    if (fs.existsSync(filePath)) {
      found.push(filePath);
    }
  }

  return found;
}

/**
 * Auto-detect include paths from project structure
 *
 * TODO: User Implementation Required
 * This function determines which directories should be included in the
 * LSP include path. The strategy affects compilation correctness.
 *
 * Current strategy:
 * 1. Add all discovered include directories
 * 2. Add RTL source directories
 * 3. Optionally add testbench directories (configurable)
 *
 * Questions to consider:
 * - Should testbench directories be included? (They may reference RTL but not vice versa)
 * - Should we recursively scan subdirectories?
 * - How deep should we scan? (1 level? 2 levels? All levels?)
 * - Should we exclude certain directories (e.g., build/, synthesis/)?
 */
export function autoDetectIncludePaths(structure: ProjectStructure, options?: {
  includeTestbench?: boolean;
  maxDepth?: number;
  excludePatterns?: string[];
}): string[] {
  const includePaths: string[] = [];

  // Add include directories (highest priority)
  includePaths.push(...structure.includeDirs);

  // Add RTL directories
  includePaths.push(...structure.rtlDirs);

  // TODO: User decision - should testbench directories be included?
  // Testbenches often reference RTL modules, but RTL should NOT reference testbenches.
  // Including testbench dirs may help with testbench development but may also
  // cause false positives if RTL accidentally references testbench code.
  if (options?.includeTestbench) {
    includePaths.push(...structure.testbenchDirs);
  }

  // TODO: User implementation - recursive directory scanning
  // Should we scan subdirectories of discovered directories?
  // This could find nested include directories but may be slow for large projects.

  return [...new Set(includePaths)]; // Remove duplicates
}

/**
 * Auto-detect defines from Makefile or build scripts
 *
 * TODO: User Implementation Required
 * This function should parse Makefile, build scripts, or configuration files
 * to extract preprocessor defines.
 *
 * Common sources:
 * - Makefile: DEFINES += -DFOO=1 -DBAR=2
 * - CMakeLists.txt: add_definitions(-DFOO=1)
 * - JSON config: { "defines": { "FOO": "1" } }
 *
 * Implementation strategy:
 * 1. Read Makefile and extract -D flags
 * 2. Read .rtl-config.json if exists
 * 3. Provide sensible defaults (e.g., SIMULATION=1 for testbenches)
 */
export async function autoDetectDefines(structure: ProjectStructure): Promise<Record<string, string>> {
  const defines: Record<string, string> = {};

  // TODO: User implementation - parse Makefile
  // Example:
  // const makefile = fs.readFileSync(path.join(structure.root, 'Makefile'), 'utf8');
  // const matches = makefile.matchAll(/-D(\w+)(?:=(\S+))?/g);
  // for (const match of matches) {
  //   defines[match[1]] = match[2] || '1';
  // }

  // TODO: User implementation - read config files
  for (const configFile of structure.configFiles) {
    if (configFile.endsWith('.json')) {
      try {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (config.defines) {
          Object.assign(defines, config.defines);
        }
      } catch (error) {
        console.warn(`Failed to parse config file ${configFile}: ${error}`);
      }
    }
  }

  return defines;
}

/**
 * Load or create default RTL configuration
 */
export async function loadRTLConfig(workspaceRoot: string): Promise<any> {
  const configPath = path.join(workspaceRoot, '.rtl-config.json');

  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to load .rtl-config.json: ${error}`);
    }
  }

  // Return default configuration
  return {
    language: 'systemverilog',
    tools: {
      lsp: {
        preferred: 'slang',
        fallback: ['verible', 'svls'],
      },
      lint: {
        preferred: 'verilator',
        rules: 'strict',
      },
    },
  };
}
