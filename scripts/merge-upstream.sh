#!/bin/bash

# oh-my-claude-rtl Upstream Merge Automation Script
# Automatically merges upstream changes while preserving fork-specific customizations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
OUR_REPO_NAME="oh-my-claude-rtl"
OUR_REPO_OWNER="babyworm"
UPSTREAM_REPO_NAME="oh-my-claudecode"
UPSTREAM_REPO_OWNER="Yeachan-Heo"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}oh-my-claude-rtl Upstream Merge Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if upstream remote exists
echo -e "${YELLOW}[1/8] Checking upstream remote...${NC}"
if ! git remote | grep -q "^${UPSTREAM_REMOTE}$"; then
    echo -e "${RED}Error: Upstream remote not found${NC}"
    echo "Please add upstream remote first:"
    echo "  git remote add upstream https://github.com/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}.git"
    exit 1
fi
echo -e "${GREEN}✓ Upstream remote exists${NC}"
echo ""

# Step 2: Fetch upstream
echo -e "${YELLOW}[2/8] Fetching upstream changes...${NC}"
git fetch ${UPSTREAM_REMOTE}
echo -e "${GREEN}✓ Upstream fetched${NC}"
echo ""

# Step 3: Check for uncommitted changes
echo -e "${YELLOW}[3/8] Checking for uncommitted changes...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes first"
    exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}"
echo ""

# Step 4: Show changes summary
echo -e "${YELLOW}[4/8] Upstream changes summary:${NC}"
COMMIT_COUNT=$(git rev-list --count HEAD..${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH})
echo "Commits ahead in upstream: ${COMMIT_COUNT}"
if [ "$COMMIT_COUNT" -eq 0 ]; then
    echo -e "${GREEN}Already up to date with upstream${NC}"
    exit 0
fi
echo ""
git log --oneline --graph --decorate HEAD..${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH} | head -10
echo ""

# Step 5: Merge upstream (no commit, no fast-forward)
echo -e "${YELLOW}[5/8] Merging upstream/${UPSTREAM_BRANCH}...${NC}"
if git merge ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH} --no-commit --no-ff 2>&1 | tee /tmp/merge_output.txt; then
    echo -e "${GREEN}✓ Merge completed without conflicts${NC}"
else
    # Check if there are conflicts
    if grep -q "CONFLICT" /tmp/merge_output.txt || [ -n "$(git diff --name-only --diff-filter=U)" ]; then
        echo -e "${YELLOW}Conflicts detected, attempting auto-resolution...${NC}"
    else
        echo -e "${RED}Merge failed${NC}"
        git merge --abort
        exit 1
    fi
fi
echo ""

# Step 6: Auto-resolve conflicts
echo -e "${YELLOW}[6/8] Auto-resolving conflicts...${NC}"

# Function to resolve package.json
resolve_package_json() {
    if git diff --name-only --diff-filter=U | grep -q "package.json"; then
        echo "  - Resolving package.json..."
        
        # Use Node.js to merge package.json intelligently
        node - <<'EOF'
const fs = require('fs');
const { execSync } = require('child_process');

try {
    // Get both versions
    const ours = JSON.parse(execSync('git show :2:package.json').toString());
    const theirs = JSON.parse(execSync('git show :3:package.json').toString());
    
    // Merge strategy: keep our identity, take their dependencies/scripts
    const merged = {
        ...theirs,  // Take all from upstream
        name: ours.name,  // Keep our name
        description: ours.description,  // Keep our description
        repository: ours.repository,  // Keep our repository
        homepage: ours.homepage,  // Keep our homepage
        bugs: ours.bugs,  // Keep our bugs URL
        author: ours.author,  // Keep our author
    };
    
    fs.writeFileSync('package.json', JSON.stringify(merged, null, 2) + '\n');
    execSync('git add package.json');
    console.log('✓ package.json resolved');
} catch (error) {
    console.error('Failed to resolve package.json:', error.message);
    process.exit(1);
}
EOF
    fi
}

# Function to resolve marketplace.json
resolve_marketplace_json() {
    if git diff --name-only --diff-filter=U | grep -q ".claude-plugin/marketplace.json"; then
        echo "  - Resolving .claude-plugin/marketplace.json..."
        
        node - <<'EOF'
const fs = require('fs');
const { execSync } = require('child_process');

try {
    const ours = JSON.parse(execSync('git show :2:.claude-plugin/marketplace.json').toString());
    const theirs = JSON.parse(execSync('git show :3:.claude-plugin/marketplace.json').toString());
    
    // Keep our metadata
    const merged = {
        ...theirs,
        name: ours.name,
        description: ours.description,
        author: ours.author,
        repository: ours.repository,
    };
    
    fs.writeFileSync('.claude-plugin/marketplace.json', JSON.stringify(merged, null, 2) + '\n');
    execSync('git add .claude-plugin/marketplace.json');
    console.log('✓ marketplace.json resolved');
} catch (error) {
    console.error('Failed to resolve marketplace.json:', error.message);
    process.exit(1);
}
EOF
    fi
}

# Function to resolve README.md
resolve_readme() {
    if git diff --name-only --diff-filter=U | grep -q "README.md"; then
        echo "  - Resolving README.md..."
        echo -e "${YELLOW}    Note: README.md needs manual review for RTL sections${NC}"
        # For now, take theirs and we'll add RTL sections manually later
        git checkout --theirs README.md
        git add README.md
        echo "✓ README.md resolved (using upstream version - add RTL sections later)"
    fi
}

# Function to apply RTL customizations to ultrawork skill
apply_rtl_customizations() {
    echo "  - Applying RTL customizations to ultrawork skill..."

    local ULTRAWORK_FILE="skills/ultrawork/SKILL.md"

    if [ ! -f "$ULTRAWORK_FILE" ]; then
        echo -e "${YELLOW}    Warning: $ULTRAWORK_FILE not found, skipping RTL customization${NC}"
        return
    fi

    # Check if RTL agents already exist
    if grep -q "RTL Architecture" "$ULTRAWORK_FILE"; then
        echo "    RTL customizations already present, skipping"
        return
    fi

    # Add RTL agents to the tier table
    sed -i '/| \*\*Code Review\*\* |.*|$/a\
| **RTL Architecture** | - | - | `rtl-architect` |\
| **RTL Coding** | - | - | `rtl-coder` |\
| **RTL Refactor** | - | `rtl-refactor` | - |\
| **RTL Review** | - | - | `rtl-reviewer` |\
| **RTL Frontend** | - | - | `rtl-fe` |\
| **RTL Verification** | - | `sv-verification` | - |\
| **TLM Modeling** | - | - | `tlm-coder` |\
| **Block Design** | - | - | `block-designer` |' "$ULTRAWORK_FILE"

    # Add RTL routing examples after the existing examples
    sed -i '/Thorough search → MEDIUM tier/,/```$/{
        /```$/a\
\
// RTL architecture design → HIGH tier (Opus)\
Task(subagent_type="oh-my-claudecode:rtl-architect", model="opus", prompt="Design microarchitecture for FIFO with AXI interface")\
\
// RTL implementation → HIGH tier (Opus) - RTL bugs are expensive!\
Task(subagent_type="oh-my-claudecode:rtl-coder", model="opus", prompt="Implement the FIFO module from block spec")\
\
// RTL lint fixes → MEDIUM tier (Sonnet)\
Task(subagent_type="oh-my-claudecode:rtl-refactor", model="sonnet", prompt="Fix lint warnings in fifo.sv")\
\
// RTL CDC/RDC review → HIGH tier (Opus) - Critical for chip reliability\
Task(subagent_type="oh-my-claudecode:rtl-reviewer", model="opus", prompt="Review CDC issues in the async_fifo module")\
\
// Verification/Testbench → MEDIUM tier (Sonnet)\
Task(subagent_type="oh-my-claudecode:sv-verification", model="sonnet", prompt="Create UVM testbench for FIFO")
    }' "$ULTRAWORK_FILE"

    # Add RTL Project Detection section before Background Execution Rules
    sed -i '/## Background Execution Rules/i\
## RTL Project Detection \& Workflow\
\
**Auto-detect RTL projects** by checking for:\
- `.rtl-config.json` file\
- `*.sv`, `*.v`, `*.svh` files in `src/` or `rtl/`\
- `tb/` or `testbench/` directories\
\
### RTL-Specific Workflow\
\
When working on RTL projects, **always run verification skills**:\
\
1. **After RTL changes**: Run `/rtl-lint` to check for syntax/semantic errors\
2. **After lint passes**: Run `/rtl-verify` to simulate and test\
3. **Before commit**: Run `/rtl-workflow` for full verification (lint → verify → synth)\
\
### RTL Delegation Rules\
\
| Task | Agent | Model | Skill to Run After |\
|------|-------|-------|-------------------|\
| Architecture design | `rtl-architect` | opus | - |\
| RTL implementation | `rtl-coder` | opus | `/rtl-lint` |\
| Lint fixes | `rtl-refactor` | sonnet | `/rtl-lint` |\
| CDC/RDC review | `rtl-reviewer` | opus | - |\
| Testbench creation | `sv-verification` | sonnet | `/rtl-verify` |\
| Synthesis check | `rtl-fe` | opus | `/rtl-synth` |\
\
### Example: RTL Implementation Flow\
\
```\
1. Task(subagent_type="rtl-coder", model="opus", prompt="Implement FIFO module")\
2. Skill(skill="rtl-lint")  # Check lint errors\
3. If lint fails → Task(subagent_type="rtl-refactor", model="sonnet", prompt="Fix lint errors")\
4. Skill(skill="rtl-verify")  # Run simulation\
5. If verify fails → Debug and iterate\
```\
\
' "$ULTRAWORK_FILE"

    # Add RTL background execution rules
    sed -i '/- Docker operations: docker build, docker pull/a\
- RTL synthesis: yosys, vivado synthesis\
- RTL simulation: verilator, iverilog, vcs (long simulations)\
- Coverage collection: coverage merging operations' "$ULTRAWORK_FILE"

    git add "$ULTRAWORK_FILE"
    echo "✓ RTL customizations applied to ultrawork skill"
}

# Execute conflict resolution
resolve_package_json
resolve_marketplace_json
resolve_readme

# Apply RTL-specific customizations (post-merge)
apply_rtl_customizations

# Check for remaining conflicts
REMAINING_CONFLICTS=$(git diff --name-only --diff-filter=U)
if [ -n "$REMAINING_CONFLICTS" ]; then
    echo -e "${YELLOW}Remaining conflicts that need manual resolution:${NC}"
    echo "$REMAINING_CONFLICTS"
    echo ""
    echo -e "${YELLOW}Please resolve these conflicts manually, then run:${NC}"
    echo "  git add <resolved-files>"
    echo "  git commit"
    echo ""
    echo "Or abort the merge:"
    echo "  git merge --abort"
    exit 1
fi

echo -e "${GREEN}✓ All conflicts auto-resolved${NC}"
echo ""

# Step 7: Run tests
echo -e "${YELLOW}[7/8] Running tests...${NC}"
if npm run build && npm run test; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}Tests failed!${NC}"
    echo "Merge is not committed. You can:"
    echo "  1. Fix the issues and commit manually"
    echo "  2. Abort the merge: git merge --abort"
    exit 1
fi
echo ""

# Step 8: Commit merge
echo -e "${YELLOW}[8/8] Committing merge...${NC}"
MERGE_MSG="Merge upstream ${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}

Merged $(git rev-list --count HEAD..${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}) commits from upstream.

Auto-resolved conflicts in:
- package.json (kept fork identity)
- .claude-plugin/marketplace.json (kept fork metadata)

RTL customizations applied:
- skills/ultrawork/SKILL.md (added RTL agents and workflow)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git commit -m "$MERGE_MSG"
echo -e "${GREEN}✓ Merge committed${NC}"
echo ""

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Upstream merge completed successfully${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the merge: git log --oneline -5"
echo "  2. Test thoroughly: npm run build && npm run test"
echo "  3. Push to origin: git push origin main"
echo ""
echo "If you encounter issues:"
echo "  - Undo commit: git reset --soft HEAD~1"
echo "  - Undo merge: git reset --hard HEAD~1"
