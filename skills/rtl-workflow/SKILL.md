---
name: rtl-workflow
description: Run complete RTL workflow (lint → verify → synth)
category: rtl
version: 0.1.0
---

# RTL Workflow Skill

This skill runs the complete RTL development workflow:
1. **Lint** - Check for syntax/semantic errors
2. **Verify** - Run simulation and tests
3. **Synth** - Synthesize and analyze PPA

This is equivalent to running `/rtl-lint`, `/rtl-verify`, and `/rtl-synth` in sequence, with automatic stopping on failures.

## Usage

```bash
/rtl-workflow [--skip-synth] [--coverage]
```

## Parameters

- `--skip-synth` (optional): Skip synthesis step (faster iteration)
- `--coverage` (optional): Collect coverage during verification
- `--strict` (optional): Enable strict lint checking

## Examples

### Full workflow
```bash
/rtl-workflow
```

### Skip synthesis (faster)
```bash
/rtl-workflow --skip-synth
```

### With coverage
```bash
/rtl-workflow --coverage
```

## Workflow Stages

### Stage 1: Lint ✨
**Purpose**: Catch syntax, semantic, and style issues

- Runs lint tool (verilator, slang, or verible)
- Checks all RTL sources in `src/`
- Reports warnings and errors

**Pass criteria**: Zero errors (warnings allowed)

If lint fails → **STOP** (fix RTL before proceeding)

### Stage 2: Verify 🧪
**Purpose**: Verify functional correctness

- Compiles RTL and testbench
- Runs simulation
- Checks test pass/fail
- Optionally collects coverage

**Pass criteria**:
- Compilation successful
- Simulation passes (exit code 0 or "TEST PASSED")
- Coverage > 80% (if enabled)

If verify fails → **STOP** (fix testbench or RTL)

### Stage 3: Synthesize 🔨
**Purpose**: Check synthesizability and estimate PPA

- Synthesizes RTL to netlist
- Analyzes timing (critical path, slack)
- Estimates area and power

**Pass criteria**:
- Synthesis succeeds (no errors)
- Timing constraints met (positive slack)
- No critical warnings

## Output Format

Example output:
```
=== RTL Workflow ===
Project: my_fifo

Stage 1: Lint ✨
  Tool: verilator
  Files: 3
  Errors: 0
  Warnings: 2
  Status: PASSED ✅

Stage 2: Verify 🧪
  Tool: verilator
  Testbench: tb_fifo
  Result: PASSED ✅
  Coverage: 87.5%

Stage 3: Synthesize 🔨
  Tool: yosys
  Cells: 1,234
  Area: 12,340 μm²
  Max Freq: 117 MHz
  Slack: +1.5 ns
  Status: PASSED ✅

=== Workflow Complete ✅ ===
All stages passed!
```

## Failure Handling

If any stage fails, the workflow stops:

```
Stage 1: Lint ✨
  ❌ ERROR: Undeclared identifier 'foo' (src/fifo.sv:42)

Workflow STOPPED at Stage 1.
Please fix errors and re-run.
```

## Use Cases

### During Development (Fast Iteration)
```bash
# Skip synthesis for faster feedback
/rtl-workflow --skip-synth
```

### Pre-Commit Check
```bash
# Full workflow before committing
/rtl-workflow --strict --coverage
```

### CI/CD Pipeline
```bash
# Automated testing in CI
/rtl-workflow --coverage
# Check exit code (0 = success, non-zero = failure)
```

### Release Candidate
```bash
# Comprehensive check before release
/rtl-workflow --strict --coverage
# Review all reports in reports/
```

## Integration with Agents

This skill can be invoked by RTL agents:

- **rtl-refactor** → runs `/rtl-lint` after refactoring
- **rtl-fe** → runs `/rtl-synth` after implementation
- **rtl-reviewer** → runs full `/rtl-workflow` before approval

## Customization

Configure workflow behavior in `.rtl-config.json`:

```json
{
  "workflow": {
    "stopOnWarnings": false,
    "coverageThreshold": 80,
    "timingMargin": 0.1,
    "stages": {
      "lint": { "enabled": true, "strict": false },
      "verify": { "enabled": true, "coverage": true },
      "synth": { "enabled": true }
    }
  }
}
```

## Reports

All workflow stages generate reports in `reports/`:

```
reports/
├── lint_report.txt       # Lint warnings/errors
├── sim_report.txt        # Simulation output
├── coverage_report.html  # Coverage analysis
└── synth_report.txt      # PPA summary
```

## Tips

1. **Run workflow frequently** to catch issues early
2. **Fix lint errors first** before moving to verification
3. **Use --skip-synth** during active development
4. **Enable coverage** for comprehensive testing
5. **Review all reports** after workflow completes

## Comparison with Individual Skills

| Approach | Use When |
|----------|----------|
| `/rtl-workflow` | Pre-commit, CI/CD, comprehensive check |
| `/rtl-lint` | Quick syntax check, during coding |
| `/rtl-verify` | Iterating on testbench or RTL logic |
| `/rtl-synth` | Checking PPA, timing closure |

## Exit Codes

- `0` - All stages passed
- `1` - Lint failed
- `2` - Verify failed
- `3` - Synth failed
