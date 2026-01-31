---
name: ultrawork
description: Activate maximum performance mode with parallel agent orchestration for high-throughput task completion
---

# Ultrawork Skill

Activates maximum performance mode with parallel agent orchestration.

## When Activated

This skill enhances Claude's capabilities by:

1. **Parallel Execution**: Running multiple agents simultaneously for independent tasks
2. **Aggressive Delegation**: Routing tasks to specialist agents immediately
3. **Background Operations**: Using `run_in_background: true` for long operations
4. **Persistence Enforcement**: Never stopping until all tasks are verified complete
5. **Smart Model Routing**: Using tiered agents to save tokens

## Smart Model Routing (CRITICAL - SAVE TOKENS)

**Choose tier based on task complexity: LOW (haiku) → MEDIUM (sonnet) → HIGH (opus)**

### Available Agents by Tier

| Domain | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **Analysis** | `architect-low` | `architect-medium` | `architect` |
| **Execution** | `executor-low` | `executor` | `executor-high` |
| **Search** | `explore` | `explore-medium` | - |
| **Research** | `researcher-low` | `researcher` | - |
| **Frontend** | `designer-low` | `designer` | `designer-high` |
| **Docs** | `writer` | - | - |
| **Visual** | - | `vision` | - |
| **Planning** | - | - | `planner`, `critic`, `analyst` |
| **Testing** | - | `qa-tester` | - |
| **Security** | `security-reviewer-low` | - | `security-reviewer` |
| **Build** | `build-fixer-low` | `build-fixer` | - |
| **TDD** | `tdd-guide-low` | `tdd-guide` | - |
| **Code Review** | `code-reviewer-low` | - | `code-reviewer` |
| **RTL Architecture** | - | - | `rtl-architect` |
| **RTL Coding** | - | - | `rtl-coder` |
| **RTL Refactor** | - | `rtl-refactor` | - |
| **RTL Review** | - | - | `rtl-reviewer` |
| **RTL Frontend** | - | - | `rtl-fe` |
| **RTL Verification** | - | `sv-verification` | - |
| **TLM Modeling** | - | - | `tlm-coder` |
| **Block Design** | - | - | `block-designer` |

### Tier Selection Guide

| Task Complexity | Tier | Examples |
|-----------------|------|----------|
| Simple lookups | LOW | "What does this function return?", "Find where X is defined" |
| Standard work | MEDIUM | "Add error handling", "Implement this feature" |
| Complex analysis | HIGH | "Debug this race condition", "Refactor auth module across 5 files" |

### Routing Examples

**CRITICAL: Always pass `model` parameter explicitly - Claude Code does NOT auto-apply models from agent definitions!**

```
// Simple question → LOW tier (saves tokens!)
Task(subagent_type="oh-my-claudecode:architect-low", model="haiku", prompt="What does this function return?")

// Standard implementation → MEDIUM tier
Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="Add error handling to login")

// Complex refactoring → HIGH tier
Task(subagent_type="oh-my-claudecode:executor-high", model="opus", prompt="Refactor auth module using JWT across 5 files")

// Quick file lookup → LOW tier
Task(subagent_type="oh-my-claudecode:explore", model="haiku", prompt="Find where UserService is defined")

// Thorough search → MEDIUM tier
Task(subagent_type="oh-my-claudecode:explore-medium", model="sonnet", prompt="Find all authentication patterns in the codebase")

// RTL architecture design → HIGH tier (Opus)
Task(subagent_type="oh-my-claudecode:rtl-architect", model="opus", prompt="Design microarchitecture for FIFO with AXI interface")

// RTL implementation → HIGH tier (Opus) - RTL bugs are expensive!
Task(subagent_type="oh-my-claudecode:rtl-coder", model="opus", prompt="Implement the FIFO module from block spec")

// RTL lint fixes → MEDIUM tier (Sonnet)
Task(subagent_type="oh-my-claudecode:rtl-refactor", model="sonnet", prompt="Fix lint warnings in fifo.sv")

// RTL CDC/RDC review → HIGH tier (Opus) - Critical for chip reliability
Task(subagent_type="oh-my-claudecode:rtl-reviewer", model="opus", prompt="Review CDC issues in the async_fifo module")

// Verification/Testbench → MEDIUM tier (Sonnet)
Task(subagent_type="oh-my-claudecode:sv-verification", model="sonnet", prompt="Create UVM testbench for FIFO")
```

## RTL Project Detection & Workflow

**Auto-detect RTL projects** by checking for:
- `.rtl-config.json` file
- `*.sv`, `*.v`, `*.svh` files in `src/` or `rtl/`
- `tb/` or `testbench/` directories

### RTL-Specific Workflow

When working on RTL projects, **always run verification skills**:

1. **After RTL changes**: Run `/rtl-lint` to check for syntax/semantic errors
2. **After lint passes**: Run `/rtl-verify` to simulate and test
3. **Before commit**: Run `/rtl-workflow` for full verification (lint → verify → synth)

### RTL Delegation Rules

| Task | Agent | Model | Skill to Run After |
|------|-------|-------|-------------------|
| Architecture design | `rtl-architect` | opus | - |
| RTL implementation | `rtl-coder` | opus | `/rtl-lint` |
| Lint fixes | `rtl-refactor` | sonnet | `/rtl-lint` |
| CDC/RDC review | `rtl-reviewer` | opus | - |
| Testbench creation | `sv-verification` | sonnet | `/rtl-verify` |
| Synthesis check | `rtl-fe` | opus | `/rtl-synth` |

### Example: RTL Implementation Flow

```
1. Task(subagent_type="rtl-coder", model="opus", prompt="Implement FIFO module")
2. Skill(skill="rtl-lint")  # Check lint errors
3. If lint fails → Task(subagent_type="rtl-refactor", model="sonnet", prompt="Fix lint errors")
4. Skill(skill="rtl-verify")  # Run simulation
5. If verify fails → Debug and iterate
```

## Background Execution Rules

**Run in Background** (set `run_in_background: true`):
- Package installation: npm install, pip install, cargo build
- Build processes: npm run build, make, tsc
- Test suites: npm test, pytest, cargo test
- Docker operations: docker build, docker pull
- RTL synthesis: yosys, vivado synthesis
- RTL simulation: verilator, iverilog, vcs (long simulations)
- Coverage collection: coverage merging operations

**Run Blocking** (foreground):
- Quick status checks: git status, ls, pwd
- File reads, edits
- Simple commands

## Verification Checklist

Before stopping, verify:
- [ ] TODO LIST: Zero pending/in_progress tasks
- [ ] FUNCTIONALITY: All requested features work
- [ ] TESTS: All tests pass (if applicable)
- [ ] ERRORS: Zero unaddressed errors

**If ANY checkbox is unchecked, CONTINUE WORKING.**

## STATE CLEANUP ON COMPLETION

**IMPORTANT: Delete state files on completion - do NOT just set `active: false`**

When all verification passes and work is complete:

```bash
# Delete ultrawork state files
rm -f .omc/state/ultrawork-state.json
rm -f ~/.claude/ultrawork-state.json
```

This ensures clean state for future sessions. Stale state files with `active: false` should not be left behind.
