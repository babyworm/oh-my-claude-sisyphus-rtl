---
name: rtl-verify
description: Run simulation and verification on RTL designs
category: rtl
version: 0.1.0
---

# RTL Verification Skill

This skill runs simulation and verification on your RTL design:
- Compile RTL and testbench
- Execute simulation
- Check test pass/fail status
- Generate waveforms (VCD)
- Collect coverage (optional)

## Usage

```bash
/rtl-verify [testbench] [--tool=verilator] [--gui] [--coverage]
```

## Parameters

- `testbench` (optional): Testbench file (default: auto-detect tb_*.sv)
- `--tool` (optional): Simulation tool - `verilator`, `iverilog`, `xrun`, or `auto` (default: auto)
- `--gui` (optional): Open waveform viewer after simulation
- `--coverage` (optional): Collect coverage data
- `--args` (optional): Additional simulation arguments

## Examples

### Run default testbench
```bash
/rtl-verify
```

### Run specific testbench
```bash
/rtl-verify tb/tb_fifo.sv
```

### With waveform viewer
```bash
/rtl-verify --gui
```

### With coverage
```bash
/rtl-verify --coverage
```

### Use specific tool
```bash
/rtl-verify --tool=iverilog
```

## Supported Tools

The skill will auto-detect and use available tools:

1. **verilator** - Fast C++-based simulation
   - Excellent for regression testing
   - VCD waveform generation
   - Coverage support
   - No timing delays

2. **iverilog** - Simple event-driven simulator
   - Full Verilog support
   - Timing simulation
   - VCD waveform generation
   - Good for educational use

3. **xrun** (commercial) - Cadence simulator
   - Full SystemVerilog support
   - Advanced debugging
   - Coverage analysis
   - Industry-standard

## Test Pass/Fail Detection

The skill automatically detects test results by looking for:
- `*** TEST PASSED ***` in output
- `*** FAIL ***` or `ERROR:` for failures
- Exit code

Make sure your testbench prints clear pass/fail messages:

```systemverilog
initial begin
    // ... run tests ...

    if (all_tests_passed) begin
        $display("*** TEST PASSED ***");
    end else begin
        $display("*** TEST FAILED ***");
        $finish(1);  // Non-zero exit code
    end
    $finish;
end
```

## Waveform Viewing

When using `--gui`, the skill will:
1. Run simulation and generate VCD
2. Open waveform viewer (gtkwave, if available)
3. Display key signals

Example VCD generation in testbench:
```systemverilog
initial begin
    $dumpfile("dump.vcd");
    $dumpvars(0, tb_top);
end
```

## Coverage Collection

When using `--coverage`, the skill collects:
- **Line coverage**: Which lines were executed
- **Toggle coverage**: Which signals toggled
- **FSM coverage**: Which states were visited

Coverage reports are saved to `reports/coverage.txt`

## Output Format

Example output:
```
==> Compiling RTL with verilator...
✅ Compilation successful

==> Running simulation...
[0] Test 1: Basic transfer
[10] Sent data: 0xDEADBEEF
[15] Received data: 0xDEADBEEF (OK)
[20] Test 2: Back-to-back transfers
...
✅ Simulation passed

Summary:
  Tool: verilator
  Time: 2.5s
  Waveform: dump.vcd
  Status: PASSED ✅
```

## Debugging Failed Tests

If simulation fails:

1. **Check compilation errors first**:
   ```bash
   /rtl-lint
   ```

2. **View waveform**:
   ```bash
   /rtl-verify --gui
   ```

3. **Enable verbose output**:
   ```bash
   /rtl-verify --args="+verbose"
   ```

4. **Check testbench assertions**:
   - Look for assertion failures in output
   - Review SVA properties

## Integration

This skill uses:
- RTL tool abstraction layer (SimulationManager)
- Auto-detected tools from `.rtl-config.json`
- Project structure from `rtl-init`

## Tips

1. **Run lint before verify** to catch syntax errors
2. **Use meaningful test names** in $display statements
3. **Add assertions** to catch issues early
4. **Keep testbenches modular** for reusability
5. **Use coverage** to ensure thorough testing
