---
name: rtl-lint
description: Run lint checks on SystemVerilog/Verilog RTL code
category: rtl
version: 0.1.0
---

# RTL Lint Skill

This skill runs lint checks on your RTL code to catch:
- Syntax errors
- Semantic errors
- Coding style violations
- Potential synthesis issues
- Undriven/unused signals
- Width mismatches

## Usage

```bash
/rtl-lint [files...] [--tool=verilator]
```

## Parameters

- `files` (optional): Specific files to lint (default: all files in src/)
- `--tool` (optional): Lint tool to use - `verilator`, `verible`, `slang`, or `auto` (default: auto)
- `--strict` (optional): Enable strict checking mode

## Examples

### Lint all RTL files
```bash
/rtl-lint
```

### Lint specific files
```bash
/rtl-lint src/fifo.sv src/arbiter.sv
```

### Use specific tool
```bash
/rtl-lint --tool=slang
```

### Strict mode
```bash
/rtl-lint --strict
```

## Supported Tools

The skill will auto-detect and use available tools in this order:

1. **verilator** - Fast, comprehensive Verilog/SystemVerilog linter
   - Syntax and semantic checking
   - Synthesis warnings
   - Width mismatch detection

2. **slang** - Modern SystemVerilog compiler
   - IEEE 1800-2017 compliance
   - Deep semantic analysis
   - Accurate error messages

3. **verible** - Style-focused linter
   - Coding style enforcement
   - Naming conventions
   - Formatting checks

## Common Issues Detected

### Width Mismatches
```systemverilog
logic [7:0] a;
logic [15:0] b;
b = a;  // Warning: implicit width extension
```

### Undriven Signals
```systemverilog
logic valid_out;
// Warning: valid_out is never assigned
```

### Unused Variables
```systemverilog
logic unused_signal;
// Warning: unused_signal is declared but never used
```

### Blocking in Sequential Logic
```systemverilog
always_ff @(posedge clk) begin
    a = b;  // Warning: blocking assignment in always_ff
end
```

## Output Format

The skill will display:
- ✅ Success with warning/error count
- ⚠️ Warnings with file:line:column location
- ❌ Errors with detailed messages
- 📊 Summary statistics

Example output:
```
==> Running lint with verilator...
⚠️ src/fifo.sv:25:10: Width mismatch (expected 8 bits, got 16)
⚠️ src/fifo.sv:42:5: Signal 'empty' is never read
❌ src/arbiter.sv:15:20: Undeclared identifier 'grant_idx'

Summary:
  Files checked: 2
  Errors: 1
  Warnings: 2
```

## Integration

This skill uses the RTL tool abstraction layer:
- Automatically detects installed tools
- Falls back to available alternatives
- Respects `.rtl-config.json` preferences

## Tips

1. **Run lint frequently** during development to catch issues early
2. **Fix errors first**, then warnings
3. **Use strict mode** for production code
4. **Customize rules** in `.rtl-config.json` if needed
5. **Integrate with CI/CD** for automated checking
