# Migration Guide: 2.x to 3.0

## TL;DR

Your old commands still work! But now you don't need them.

**Before 3.0:** Explicitly invoke 25+ commands like `/ralph "task"`, `/ultrawork "task"`

**After 3.0:** Just work naturally - Claude auto-activates the right behaviors. One-time setup: just say "setup omc"

---

## What Changed

### Before (2.x): Explicit Commands

You had to remember and explicitly invoke specific commands for each mode:

```bash
# 2.x workflow: Multiple commands, lots to remember
/ralph "implement user authentication"       # Persistence mode
/ultrawork "refactor the API layer"          # Maximum parallelism
/planner "plan the new dashboard"            # Planning interview
/deepsearch "find database schema files"     # Deep search
/git-master "commit these changes"           # Git expertise
/deepinit ./src                              # Index codebase
/analyze "why is this test failing?"         # Deep analysis
```

### After (3.0): Auto-Activation + Keywords

Work naturally. Claude detects intent and activates behaviors automatically:

```bash
# 3.0 workflow: Just talk naturally OR use optional keywords
"don't stop until user auth is done"                # Auto-activates ralph-loop
"fast: refactor the entire API layer"               # Auto-activates ultrawork
"plan: design the new dashboard"                    # Auto-activates planning
"ralph ulw: migrate the database"                   # Combined: persistence + parallelism
"find all database schema files"                    # Auto-activates search mode
"commit these changes properly"                     # Auto-activates git expertise
```

---

## Command Mapping

All 2.x commands continue to work. Here's what changed:

| 2.x Command | 3.0 Equivalent | Works? |
|-------------|----------------|--------|
| `/ralph "task"` | Say "don't stop until done" OR use `ralph` keyword | ✅ YES (both ways) |
| `/ultrawork "task"` | Say "fast" or "parallel" OR use `ulw` keyword | ✅ YES (both ways) |
| `/ultrawork-ralph` | Say "ralph ulw:" prefix | ✅ YES (keyword combo) |
| `/planner "task"` | Say "plan this" OR use `plan` keyword | ✅ YES (both ways) |
| `/plan "description"` | Start planning naturally | ✅ YES |
| `/review [path]` | Invoke normally | ✅ YES (unchanged) |
| `/deepsearch "query"` | Say "find" or "search" | ✅ YES (auto-detect) |
| `/analyze "target"` | Say "analyze" or "investigate" | ✅ YES (auto-detect) |
| `/deepinit [path]` | Invoke normally | ✅ YES (unchanged) |
| `/git-master` | Say "git", "commit", "atomic commit" | ✅ YES (auto-detect) |
| `/frontend-ui-ux` | Say "UI", "styling", "component", "design" | ✅ YES (auto-detect) |
| `/note "content"` | Say "remember this" or "save this" | ✅ YES (auto-detect) |
| `/cancel-ralph` | Say "stop", "cancel", or "abort" | ✅ YES (auto-detect) |
| `/doctor` | Invoke normally | ✅ YES (unchanged) |
| All other commands | Work exactly as before | ✅ YES |

---

## Magic Keywords

Include these anywhere in your message to explicitly activate behaviors. Use keywords when you want explicit control (optional):

| Keyword | Effect | Example |
|---------|--------|---------|
| `ralph` | Persistence mode - won't stop until done | "ralph: refactor the auth system" |
| `ralplan` | Iterative planning with consensus | "ralplan: add OAuth support" |
| `ulw` / `ultrawork` | Maximum parallel execution | "ulw: fix all type errors" |
| `plan` | Planning interview | "plan: new API design" |

**Combine them for superpowers:**
```
ralph ulw: migrate the entire database
    ↓
Persistence (won't stop) + Ultrawork (maximum parallelism)
```

**No keywords?** Claude still auto-detects:
```
"don't stop until this works"      # Triggers ralph
"fast, I'm in a hurry"             # Triggers ultrawork
"help me design the dashboard"     # Triggers planning
```

---

## Natural Cancellation

Say any of these to stop:
- "stop"
- "cancel"
- "abort"
- "nevermind"
- "enough"
- "halt"

Claude intelligently determines what to stop:

```
If in ralph-loop     → Exit persistence loop
If in ultrawork      → Return to normal mode
If in planning       → End planning interview
If multiple active   → Stop the most recent
```

No more `/cancel-ralph` - just say "cancel"!

---

## Backward Compatibility: All 2.x Commands Still Work

**Zero breaking changes.** Your existing workflows don't break.

### Explicit Command Invocation Still Works

You can still use explicit commands if you prefer:

```bash
/ralph "implement OAuth"           # Still works ✅
/ultrawork "refactor everything"   # Still works ✅
/planner "plan the feature"        # Still works ✅
/cancel-ralph                      # Still works ✅
```

These are now **optional** - use them if you like, but you don't have to.

### Skill Composition

Skills now compose automatically based on context:

```
Natural request: "Help me refactor the API quickly"
    ↓
Auto-detects: Need orchestration + speed
    ↓
Activates: orchestrate + ultrawork + git-master skills
    ↓
Result: Parallel agents, atomic commits, fast implementation
```

You don't need to invoke multiple commands manually - Claude figures it out.

---

## Breaking Changes

**None!** Version 3.0 is purely additive:

- All 2.x commands continue to work
- All agents renamed but function identically (oracle → architect, etc.)
- Directory structure changed (.sisyphus → .omc) but handled automatically
- Environment variables renamed (SISYPHUS_* → OMC_*) but old ones still recognized

See [MIGRATION-v3.md](MIGRATION-v3.md) for detailed 2.x → 3.0 naming changes.

---

## New Features in 3.0

### 1. Zero-Learning-Curve Operation

**No commands to memorize.** Work naturally:

```
Before: "OK, I need to use /ultrawork for speed..."
After:  "I'm in a hurry, go fast!"
        ↓
        Claude: "I'm activating ultrawork mode..."
```

### 2. Delegate Always (Automatic)

Complex work auto-routes to specialist agents:

```
Your request              Claude's action
────────────────────     ────────────────────
"Refactor the database"   → Delegates to architect
"Fix the UI colors"       → Delegates to designer
"Document this API"       → Delegates to writer
"Search for all errors"   → Delegates to explore
"Debug this crash"        → Delegates to architect
```

You don't ask for delegation - it happens automatically.

### 3. Learned Skills (`/learner`)

Extract reusable insights from problem-solving:

```bash
# After solving a tricky bug:
"Extract this as a skill"
    ↓
Claude learns the pattern and stores it
    ↓
Next time keywords match → Solution auto-injects
```

Storage:
- **Project-level**: `.omc/skills/` (version-controlled)
- **User-level**: `~/.claude/skills/omc-learned/` (portable)

### 4. HUD Statusline (Real-Time Orchestration)

See what Claude is doing in the status bar:

```
[OMC] ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | todos:2/5
```

Run `/hud setup` to install. Presets: minimal, focused, full.

### 5. Three-Tier Memory System

Critical knowledge survives context compaction:

```
<remember priority>API client at src/api/client.ts</remember>
    ↓
Permanently loaded on session start
    ↓
Never lost through compaction
```

Or use `/note` to save discoveries manually:

```bash
/note Project uses PostgreSQL with Prisma ORM
```

### 6. Structured Task Tracking (PRD Support)

**Ralph Loop now uses Product Requirements Documents:**

```bash
/ralph-init "implement OAuth with multiple providers"
    ↓
Auto-creates PRD with user stories
    ↓
Each story: description + acceptance criteria + pass/fail
    ↓
Ralph loops until ALL stories pass
```

### 7. Intelligent Continuation

**Tasks complete before Claude stops:**

```
You: "Implement user dashboard"
    ↓
Claude: "I'm activating ralph-loop to ensure completion"
    ↓
Creates todo list, works through each item
    ↓
Only stops when EVERYTHING is verified complete
```

---

## Getting Started with 3.0

### Step 1: Update Your Plugin

```bash
# Plugin auto-updates, but you can manually update:
npm update -g oh-my-claudecode
```

### Step 2: Run One-Time Setup

In Claude Code, just say "setup omc", "omc setup", or any natural language equivalent.

This:
- Downloads latest CLAUDE.md
- Configures 19 agents
- Enables auto-behavior detection
- Activates continuation enforcement
- Sets up skill composition

### Step 3: Use Naturally

**Just work.** Everything is automatic.

```bash
"refactor the authentication system"
    ↓
Claude auto-detects: complex task, multi-file changes
    ↓
Activates: orchestrate + git-master skills
    ↓
You're done - Claude handles the rest
```

---

## Configuration Options

### Project-Scoped Configuration (Recommended)

Apply oh-my-claudecode to current project only:

```
/omc-default
```

Creates: `./.claude/CLAUDE.md`

### Global Configuration

Apply to all Claude Code sessions:

```
/omc-default-global
```

Creates: `~/.claude/CLAUDE.md`

**Precedence:** Project config overrides global if both exist.

---

## Common Scenarios: 2.x vs 3.0

### Scenario 1: Quick Implementation Task

**2.x Workflow:**
```
/ultrawork "implement the todo list feature"
```

**3.0 Workflow:**
```
"implement the todo list feature quickly"
    ↓
Claude: "I'm activating ultrawork for maximum parallelism"
```

**Result:** Same outcome, more natural interaction.

### Scenario 2: Complex Debugging

**2.x Workflow:**
```
/ralph "debug the memory leak"
```

**3.0 Workflow:**
```
"there's a memory leak in the worker process - don't stop until we fix it"
    ↓
Claude: "I'm activating ralph-loop to ensure completion"
```

**Result:** Ralph-loop with more context from your natural language.

### Scenario 3: Strategic Planning

**2.x Workflow:**
```
/planner "design the new authentication system"
```

**3.0 Workflow:**
```
"plan the new authentication system"
    ↓
Claude: "I'm starting a planning session"
    ↓
Interview begins automatically
```

**Result:** Planning interview triggered by natural language.

### Scenario 4: Stopping Work

**2.x Workflow:**
```
/cancel-ralph
```

**3.0 Workflow:**
```
"stop"
```

**Result:** Claude intelligently cancels the active operation.

---

## Migration Checklist

If you're upgrading from 2.x:

- [ ] Install/Update plugin: `claude plugin install oh-my-claude-sisyphus`
- [ ] Run setup: say "setup omc"
- [ ] Test natural language: Say "don't stop until done" (should activate ralph)
- [ ] Test keyword: Use `ralph` keyword in a request (should activate ralph-loop)
- [ ] Test cancellation: Say "stop" (should cancel active operation)
- [ ] Review existing scripts: Update references to old command names (optional - old commands still work)

---

## FAQ

**Q: Do I have to use keywords?**
A: No. Keywords are optional shortcuts. Claude auto-detects intent without them.

**Q: Will my old commands break?**
A: No. All 2.x commands continue to work exactly as before.

**Q: What if I like explicit commands?**
A: Keep using them! `/ralph`, `/ultrawork`, `/planner` all still work.

**Q: How do I know what Claude is doing?**
A: Claude announces major behaviors: "I'm activating ralph-loop..." or set up `/hud` for real-time status.

**Q: Where's the old command list?**
A: See [README.md](../README.md) for full command reference. All commands still work.

**Q: What's the difference between keywords and natural language?**
A: Keywords are explicit shortcuts. Natural language triggers auto-detection. Both work.

---

## Need Help?

- **Diagnose issues**: Run `/doctor`
- **See all commands**: Run `/oh-my-claudecode:help`
- **View real-time status**: Run `/hud setup`
- **Review detailed changelog**: See [CHANGELOG.md](../CHANGELOG.md)
- **Report bugs**: [GitHub Issues](https://github.com/Yeachan-Heo/oh-my-claude-sisyphus/issues)

---

## What's Next?

Now that you understand the migration:

1. **For immediate impact**: Start using keywords (`ralph`, `ulw`, `plan`) in your work
2. **For full power**: Read [docs/CLAUDE.md](CLAUDE.md) to understand orchestration
3. **For advanced usage**: Check [docs/ARCHITECTURE.md](ARCHITECTURE.md) for deep dives
4. **For team onboarding**: Share this guide with teammates

Welcome to 3.0!
