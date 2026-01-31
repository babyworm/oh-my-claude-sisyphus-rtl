---
name: rtl-init
description: Initialize a new RTL project with proper directory structure and tooling setup
category: rtl
version: 0.1.0
---

# RTL Project Initialization Skill

This skill helps you quickly set up a new RTL design project with:
- Proper directory structure (src/, tb/, synth/, reports/)
- Makefile for common operations (lint, sim, synth)
- Template files (module skeleton, testbench skeleton)
- Configuration files (.rtl-config.json, .gitignore)

## Usage

```bash
/rtl-init <project-name> [--language=systemverilog] [--template=basic]
```

## Parameters

- `project-name` (required): Name of the project (e.g., "my_fifo")
- `--language` (optional): RTL language - `verilog` or `systemverilog` (default: systemverilog)
- `--template` (optional): Project template - `basic`, `fifo`, `counter`, `pipeline` (default: basic)

## Examples

### Basic SystemVerilog project
```bash
/rtl-init my_design
```

### Verilog FIFO project
```bash
/rtl-init my_fifo --language=verilog --template=fifo
```

### Pipeline project
```bash
/rtl-init my_pipeline --template=pipeline
```

## What Gets Created

```
project-name/
├── src/                    # RTL source files
│   └── project_name.sv    # Main module
├── tb/                     # Testbenches
│   └── tb_project_name.sv # Testbench
├── synth/                  # Synthesis scripts and outputs
├── reports/                # Lint, simulation, synthesis reports
├── Makefile                # Build automation
├── .rtl-config.json        # RTL tool configuration
└── .gitignore              # Git ignore file
```

## Tool Requirements

This skill works with:
- **LSP**: slang, verible, or svls (auto-detected)
- **Lint**: verilator, verible-lint, or slang (auto-detected)
- **Simulation**: verilator or iverilog (auto-detected)
- **Synthesis**: yosys (optional)

The skill will detect installed tools and configure the Makefile accordingly.

## Post-Initialization

After running this skill, you can:

1. **Lint your design**:
   ```bash
   /rtl-lint
   ```

2. **Run simulation**:
   ```bash
   /rtl-verify
   ```

3. **Synthesize**:
   ```bash
   /rtl-synth
   ```

4. **Run full workflow**:
   ```bash
   /rtl-workflow
   ```

## Notes

- The skill will NOT overwrite an existing project directory
- Generated Makefiles use detected tools (verilator, iverilog, yosys)
- SystemVerilog is recommended for new projects (better language features)
- Templates provide working examples you can extend
