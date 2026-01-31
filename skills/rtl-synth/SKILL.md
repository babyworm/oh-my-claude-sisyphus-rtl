---
name: rtl-synth
description: Synthesize RTL design and analyze PPA (Performance, Power, Area)
category: rtl
version: 0.1.0
---

# RTL Synthesis Skill

This skill synthesizes your RTL design to:
- Generate gate-level netlist
- Analyze timing (critical path, slack)
- Estimate PPA (Performance, Power, Area)
- Check synthesis warnings

## Usage

```bash
/rtl-synth [design] [--tool=yosys] [--tech=generic]
```

## Parameters

- `design` (optional): Top module to synthesize (default: auto-detect)
- `--tool` (optional): Synthesis tool - `yosys`, `dc`, `genus`, or `auto` (default: auto)
- `--tech` (optional): Target technology - `generic`, `ice40`, `xilinx`, etc. (default: generic)
- `--clock` (optional): Clock frequency target (e.g., `100MHz`)

## Examples

### Basic synthesis
```bash
/rtl-synth
```

### Specify top module
```bash
/rtl-synth fifo_top
```

### Target FPGA
```bash
/rtl-synth --tech=ice40 --clock=50MHz
```

### Use specific tool
```bash
/rtl-synth --tool=yosys
```

## Supported Tools

The skill will auto-detect and use available tools:

1. **yosys** (opensource) - Verilog synthesis
   - Technology mapping (generic, FPGA)
   - ABC optimization
   - Area/cell count estimation
   - Netlist generation

2. **Design Compiler** (commercial) - Synopsys
   - ASIC synthesis
   - Advanced timing analysis
   - Power optimization
   - Industry-standard

3. **Genus** (commercial) - Cadence
   - Physical synthesis
   - Multi-mode multi-corner
   - Low-power optimization

## Output

The skill generates:

1. **Netlist**: `synth/synthesized.v`
2. **Reports**: `reports/synth_report.txt`
   - Area breakdown
   - Timing analysis
   - Power estimation
3. **Statistics**: Cell count, hierarchy

Example output:
```
==> Synthesizing with yosys...
Reading design files...
  src/fifo.sv
  src/counter.sv

Running synthesis...
  Technology: generic
  Target frequency: 100 MHz

Optimization...
  ABC technology mapping
  Simplification passes

✅ Synthesis successful

PPA Summary:
  Area:
    Cells: 1,234
    Area: 12,340 μm²

  Power:
    Dynamic: 5.2 mW
    Static: 0.8 mW
    Total: 6.0 mW

  Performance:
    Critical path: 8.5 ns
    Max frequency: 117 MHz
    Slack: +1.5 ns ✅

Files generated:
  synth/synthesized.v
  reports/synth_report.txt
```

## PPA Analysis

### Performance (Timing)
- **Critical Path**: Longest delay path in design
- **Slack**: Time margin (positive = meets timing, negative = fails)
- **Max Frequency**: Maximum achievable clock speed

### Power
- **Dynamic Power**: Power consumed during switching
- **Static Power**: Leakage power
- **Total Power**: Sum of dynamic and static

### Area
- **Cell Count**: Number of logic gates
- **Area**: Physical silicon area (μm²)

## Technology Libraries

For accurate PPA, synthesis needs technology libraries:

**Generic (Yosys default)**:
- No timing information
- Basic cell count
- Rough area estimation

**FPGA (ice40, xilinx)**:
- FPGA-specific primitives
- LUT/FF count
- Routing estimation

**ASIC (commercial)**:
- Foundry PDK (7nm, 28nm, etc.)
- Accurate timing/power
- Physical layout aware

## Synthesis Warnings

Common warnings to watch for:

### Inferred Latches
```systemverilog
always_comb begin
    if (sel) out = a;
    // Missing else -> latch inferred
end
```

### Unconnected Ports
```
Warning: Port 'unused_out' is unconnected
```

### Width Mismatches
```
Warning: Truncating 16-bit signal to 8 bits
```

### Multi-driven Nets
```
Error: Signal 'data' is driven by multiple sources
```

## Optimization Tips

1. **Pipeline critical paths** to improve frequency
2. **Register outputs** to break combinational paths
3. **Use synchronous resets** for better QoR
4. **Avoid latches** - always specify else/default cases
5. **Parameterize designs** for different PPA targets

## Constraints

Create synthesis constraints file (SDC format):

```tcl
# synth/constraints.sdc
create_clock -period 10 [get_ports clk]  # 100 MHz
set_input_delay 2 -clock clk [all_inputs]
set_output_delay 2 -clock clk [all_outputs]
```

## Integration

This skill uses:
- RTL tool abstraction layer (SynthesisManager)
- Auto-detected tools
- `.rtl-config.json` for default technology

## Next Steps

After synthesis:
1. **Review PPA** - Does it meet requirements?
2. **Check warnings** - Fix issues in RTL
3. **Iterate design** - Optimize critical paths
4. **Run post-synth simulation** - Verify functionality

For ASIC:
5. **Place & Route** - Physical implementation
6. **Signoff** - Timing, power, IR drop

For FPGA:
5. **Place & Route** - nextpnr or vendor tools
6. **Generate bitstream** - Program FPGA
