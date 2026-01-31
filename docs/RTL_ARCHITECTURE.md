# oh-my-claude-rtl Architecture Design

## 🎯 Overview

oh-my-claude-rtl은 실제 하드웨어 개발 워크플로우를 반영한 멀티-에이전트 RTL 개발 시스템입니다. oh-my-claudecode의 플러그인 아키텍처를 활용하여 upstream 변경에 영향받지 않으면서 RTL 전문 기능을 제공합니다.

---

## 🏗️ Architecture Principles

### 1. Pluggable Architecture
- **완전한 분리**: RTL 기능은 `src/rtl/` 디렉토리에 독립적으로 존재
- **Upstream 호환성**: 코어 파일 수정 최소화로 merge 충돌 방지
- **동적 발견**: `agents/*.md` 파일을 자동 스캔하여 RTL agents 등록

### 2. Tool Abstraction Layer
- **오픈소스 지원**: verilator, yosys, iverilog, OSS CAD Suite
- **상용 도구 지원**: Cadence (xrun), Synopsys (DC, VCS, Spyglass), Siemens (Questa)
- **자동 Fallback**: 설치된 도구를 자동 감지하여 최적 선택
- **Graceful Degradation**: 도구가 없어도 기본 기능 제공

### 3. Hardware Development Workflow
실제 하드웨어 개발 프로세스를 충실히 반영:

```
Requirements → Architecture → Design → Implementation → Verification → Refinement → Review
```

---

## 📊 RTL Development Workflow

### Stage 1: Architecture (요구사항 → 아키텍처)

**Agent**: `rtl-architect` (Opus)

**Input**: 하드웨어 요구사항 (성능, 전력, 면적)
**Output**: 아키텍처 사양서 (Architecture Spec)

**활동**:
- 요구사항 분석
- 마이크로아키텍처 설계 (데이터패스, 제어 경로)
- 트레이드오프 분석 (성능 vs 전력 vs 면적)
- 참조 디자인 검색 (논문, 기존 IP)

### Stage 2: Design (아키텍처 → 블럭 설계)

**Agent**: `block-designer` (Sonnet)

**Input**: 아키텍처 사양서
**Output**: 블럭 다이어그램, 파이프라인 스펙, 인터페이스 정의, PPA 예상

**활동**:
- 블럭 단위 분할 (모듈 계층 구조)
- 파이프라인 스테이지 설계
- 블럭 간 인터페이스 정의 (신호, 프로토콜)
- PPA 예상 (면적, 타이밍, 전력)

### Stage 3: Implementation (병렬)

#### 3A: RTL Implementation

**Agent**: `rtl-coder` (Sonnet)

**Input**: 블럭 사양, 인터페이스 정의
**Output**: SystemVerilog RTL 코드

**활동**:
- SystemVerilog 모듈 구현
- 인터페이스 구현 (포트, 신호)
- Syntax/Semantics 정확성 확보
- slang LSP 활용 (diagnostics, hover)

#### 3B: TLM Reference Model

**Agent**: `tlm-coder` (Sonnet)

**Input**: 블럭 사양, 기능 요구사항
**Output**: SystemC TLM 코드

**활동**:
- SystemC TLM 2.0 모델 구현
- 트랜잭션 레벨 동작 모델링
- 검증용 참조 모델 생성

### Stage 4: Verification (검증)

**Agent**: `sv-verification` (Sonnet)

**Input**: RTL 코드, TLM 참조 모델
**Output**: UVM testbench, coverage report

**활동**:
- UVM testbench 구축 (driver, monitor, scoreboard)
- cocotb 테스트 작성 (Python 기반)
- Code coverage + Functional coverage 수집
- RTL vs TLM 출력 비교
- SVA assertion 작성

**Coverage Types**:
- Line coverage
- Toggle coverage
- FSM coverage
- Functional coverage (covergroup)

### Stage 5: Refinement (병렬)

#### 5A: Refactoring

**Agent**: `rtl-refactor` (Sonnet)

**Input**: RTL 코드 (lint 경고 포함)
**Output**: 리팩토링된 RTL 코드

**활동**:
- Lint 경고/에러 수정
- Syntax error 수정
- 코딩 스타일 일관성
- 코드 가독성 향상

**Tools**: slang LSP, verilator --lint-only, verible-lint

#### 5B: Synthesis & PPA

**Agent**: `rtl-fe` (Sonnet)

**Input**: RTL 코드, 제약조건 (SDC)
**Output**: 합성 리포트, 타이밍 분석, PPA 추산

**활동**:
- RTL 합성 (Yosys / Design Compiler)
- 타이밍 분석 (setup/hold violations)
- PPA 추산 (면적, 전력, 성능)
- 합성 경고/에러 해석

**Tools**: yosys (오픈소스), Design Compiler (상용)

### Stage 6: Review (최종 검토)

**Agent**: `rtl-reviewer` (Sonnet)

**Input**: 리팩토링된 RTL 코드
**Output**: CDC/RDC/DFT 리포트

**활동**:
- CDC (Clock Domain Crossing) 체크
- RDC (Reset Domain Crossing) 체크
- DFT (Design for Test) 검증
- Metastability 위험 분석

**Tools**: Spyglass (상용), 정적 분석 스크립트 (오픈소스)

---

## 🛠️ Tool Abstraction Layer

### Design Philosophy

각 도구 카테고리별로 공통 인터페이스를 정의하여, 오픈소스와 상용 도구를 동일하게 사용할 수 있도록 추상화합니다.

```typescript
// 공통 인터페이스
interface ToolRunner {
  run(input: ToolInput): Promise<ToolResult>;
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string>;
}

// 카테고리별 인터페이스
interface LintTool extends ToolRunner {
  lint(files: string[]): Promise<LintResult>;
}

interface SimulationTool extends ToolRunner {
  compile(files: string[]): Promise<CompileResult>;
  simulate(testbench: string): Promise<SimulationResult>;
}

interface SynthesisTool extends ToolRunner {
  synthesize(design: string, constraints: string): Promise<SynthesisResult>;
}
```

### Tool Categories

#### 1. LSP (Language Server Protocol)

**Primary**: slang LSP
- IEEE 1800-2017 완전 지원
- 빠른 diagnostics (syntax, semantic)
- Document symbols, hover, go-to-definition

**Fallback**: verible-verilog-ls, svls

**Auto-detection**:
```typescript
const lsp = await detectLSP();  // 'slang' | 'verible' | 'svls' | 'none'
const client = await createLSPClient(lsp);
```

#### 2. Lint

| Tool | Type | Use Case |
|------|------|----------|
| verilator | 오픈소스 | 기본 lint, 가장 널리 사용 |
| verible-lint | 오픈소스 | Style checking |
| slang | 오픈소스 | Semantic analysis |
| Spyglass | 상용 | CDC/RDC/DFT, 프로덕션 |

**Priority**: 사용자 지정 > 상용 > 오픈소스

#### 3. Simulation

| Tool | Type | Use Case |
|------|------|----------|
| verilator | 오픈소스 | 빠른 시뮬레이션, C++ testbench |
| iverilog | 오픈소스 | 기본 Verilog 시뮬레이션 |
| cocotb | 오픈소스 | Python 기반 testbench |
| xrun | 상용 (Cadence) | 프로덕션 검증 |
| VCS | 상용 (Synopsys) | 프로덕션 검증 |
| Questa | 상용 (Siemens) | 프로덕션 검증 |

**Coverage 지원**: xrun, VCS, Questa는 code/functional coverage 자동 수집

#### 4. Synthesis

| Tool | Type | Use Case |
|------|------|----------|
| yosys | 오픈소스 | FPGA 합성, ASIC 기초 |
| Design Compiler | 상용 (Synopsys) | ASIC 프로덕션 합성 |
| Genus | 상용 (Cadence) | ASIC 프로덕션 합성 |

**PPA Estimation**: 
- yosys: Cell count, net count
- DC/Genus: Area, power, timing (정확한 PPA)

### Tool Selection Algorithm

```typescript
class ToolManager {
  selectTool(category: 'lint' | 'sim' | 'synth', config: ToolConfig): Tool {
    // 1. 사용자 지정 도구 (우선)
    if (config.preferred && this.isInstalled(config.preferred)) {
      return this.getTool(config.preferred);
    }
    
    // 2. 상용 도구 (프로덕션 환경)
    const commercial = this.detectCommercialTools(category);
    if (commercial.length > 0) {
      return commercial[0];  // 첫 번째 발견된 상용 도구
    }
    
    // 3. 오픈소스 도구 (Fallback)
    const opensource = this.detectOpensourceTools(category);
    if (opensource.length > 0) {
      return opensource[0];  // 가장 널리 사용되는 오픈소스
    }
    
    // 4. No-op (Graceful degradation)
    return new NoOpTool();
  }
}
```

---

## 🤖 Agent System

### Agent Tier Strategy

| Tier | Model | Use Case | Cost |
|------|-------|----------|------|
| **High** | Opus | 복잡한 아키텍처 설계, 트레이드오프 분석 | 높음 |
| **Medium** | Sonnet | 표준 작업 (코딩, 검증, 합성) | 중간 |
| **Low** | Haiku | 간단한 수정, 빠른 질의 | 낮음 |

### Agent Catalog

| Agent | Model | Trigger Keywords | Next Steps |
|-------|-------|------------------|------------|
| `rtl-architect` | Opus | architecture, microarchitecture, requirements | block-designer |
| `block-designer` | Sonnet | block diagram, pipeline, interface | rtl-coder, tlm-coder |
| `rtl-coder` | Sonnet | systemverilog, rtl, module | sv-verification, rtl-refactor |
| `tlm-coder` | Sonnet | systemc, tlm, reference model | sv-verification |
| `sv-verification` | Sonnet | uvm, testbench, coverage, cocotb | rtl-refactor, rtl-fe |
| `rtl-refactor` | Sonnet | lint, refactor, code quality | rtl-fe |
| `rtl-fe` | Sonnet | synthesis, timing, ppa | rtl-reviewer |
| `rtl-reviewer` | Sonnet | cdc, rdc, dft | (완료) |

### Agent Communication

Agents는 **workflow 파일**을 통해 상호 작용합니다:

```yaml
# agents/workflow.yaml
workflow:
  stages:
    - name: architecture
      agents: [rtl-architect]
      outputs: [architecture_spec.md]
      
    - name: design
      agents: [block-designer]
      inputs: [architecture_spec.md]
      outputs: [block_diagrams/, interfaces/]
      
    - name: implementation
      parallel: true
      agents: [rtl-coder, tlm-coder]
      inputs: [block_diagrams/, interfaces/]
      outputs: [rtl/*.sv, tlm/*.cpp]
```

**Orchestrator**가 workflow를 파싱하여 적절한 순서로 agents를 호출합니다.

---

## 🔌 Extension Points (확장 가능성)

### 1. Coding Style & Reference Code

각 agent의 prompt는 **나중에** 코딩 스타일 가이드와 참조 코드를 추가할 수 있도록 설계되었습니다:

```yaml
# agents/rtl-coder.md (미래 확장)
---
name: rtl-coder
# ... (기본 설정)
extensions:
  codingStyle:
    file: "coding-styles/systemverilog-ieee.md"
  referenceCode:
    directory: "reference-code/rtl"
  templates:
    - "templates/systemverilog/module.sv.template"
---
```

**확장 시점**:
- Phase 12 (나중에): 코딩 스타일, 참조 코드 추가
- 사용자 정의 스타일 가이드 제공 가능

### 2. Custom Agents

사용자는 `agents/` 디렉토리에 `.md` 파일을 추가하여 **커스텀 agent**를 쉽게 생성할 수 있습니다:

```yaml
# agents/my-custom-agent.md
---
name: my-custom-agent
description: My custom RTL agent
model: sonnet
tools: [Read, Write, Edit]
metadata:
  category: custom
  triggers:
    keywords: ["my-keyword"]
---

You are a custom RTL agent...
```

**동적 발견**: oh-my-claudecode의 agent discovery 시스템이 자동으로 인식합니다.

### 3. Custom Tools

도구 추상화 레이어 덕분에 새로운 도구를 쉽게 추가할 수 있습니다:

```typescript
// src/rtl/tools/simulation/my-simulator.ts
export class MySimulator implements SimulationTool {
  async compile(files: string[]): Promise<CompileResult> {
    // 커스텀 구현
  }
  
  async simulate(testbench: string): Promise<SimulationResult> {
    // 커스텀 구현
  }
}

// 등록
simulationManager.registerTool('my-simulator', new MySimulator());
```

---

## 📁 Directory Structure Rationale

### Core Separation

```
src/rtl/              # RTL 모듈 (upstream과 완전 분리)
agents/               # Agent 정의 (동적 발견)
skills/               # Skill 정의 (사용자 명령)
templates/            # 프로젝트 템플릿
examples/             # 예제 프로젝트
```

**Why?**
- `src/rtl/`: upstream merge 충돌 방지
- `agents/`: 동적 발견으로 Core 파일 수정 불필요
- `skills/`: 사용자 명령 제공 (CLI 통합)
- `templates/`: 프로젝트 초기화 간소화

### Tool Abstraction Structure

```
src/rtl/tools/
├── lint/           # Lint 도구들
├── simulation/     # 시뮬레이션 도구들
├── synthesis/      # 합성 도구들
├── coverage/       # Coverage 도구들
└── waveform/       # Waveform 도구들
```

**Why?**
- 카테고리별 분리 → 도구 추가 용이
- 각 카테고리는 공통 인터페이스 구현 → 일관성
- Manager 패턴 → 자동 도구 선택

---

## 🔄 Upstream Merge Strategy

### Minimal Changes

**수정 필요 파일** (최소):
- `package.json`: name, description, repository
- `.claude-plugin/marketplace.json`: name, description
- `README.md`: RTL 섹션 추가

**수정 불필요 파일** (대부분):
- `src/agents/definitions.ts`: 동적 발견으로 RTL agents 자동 로드
- `src/features/*`: upstream 그대로 사용
- `src/cli/*`: upstream 그대로 사용

### Merge Automation

`scripts/merge-upstream.sh`가 자동 처리:

1. **Upstream fetch**: `git fetch upstream`
2. **Merge**: `git merge upstream/main --no-commit --no-ff`
3. **Auto-resolve conflicts**:
   - `package.json`: name, description, repository만 유지
   - `marketplace.json`: metadata 병합
4. **Test**: `npm run build && npm run test`
5. **Commit**: 충돌 없으면 자동 commit

**Manual intervention**: Core 로직이 크게 변경된 경우에만 필요

---

## 📈 Scalability & Future Work

### Phase 1-6 (Current Plan)

- [x] Architecture design
- [ ] Core RTL module structure
- [ ] 8 core agents (architect, designer, coder, tlm, verification, refactor, fe, reviewer)
- [ ] LSP integration (slang)
- [ ] Tool abstraction (lint, sim, synth)
- [ ] Upstream merge automation

### Phase 7+ (Future)

- [ ] Coding style guides (SystemVerilog, SystemC)
- [ ] Reference code library
- [ ] Advanced verification (formal, emulation)
- [ ] Physical design integration (P&R, timing closure)
- [ ] ML-based PPA prediction
- [ ] Cloud-based EDA tool integration

### Community Extensions

사용자가 쉽게 확장할 수 있도록:
- Custom agents (`.md` 파일 추가)
- Custom tools (Tool 인터페이스 구현)
- Custom templates (프로젝트 템플릿)
- Custom workflows (YAML 워크플로우)

---

## 🎯 Design Goals Achievement

| Goal | Strategy | Status |
|------|----------|--------|
| **Minimal upstream changes** | Plugin architecture, dynamic discovery | ✅ Achieved |
| **Tool flexibility** | Abstraction layer, auto-detection | ✅ Designed |
| **Real-world workflow** | 8 stages, parallel execution | ✅ Designed |
| **Extensibility** | Extension points, custom agents | ✅ Designed |
| **Upstream compatibility** | Merge automation, fallback | ✅ Designed |

---

## 🚀 Next Steps

1. **Phase 0**: Merge automation script (`scripts/merge-upstream.sh`)
2. **Phase 1**: Create `src/rtl/` structure
3. **Phase 2**: Write first 3 agents (architect, block-designer, rtl-coder)
4. **Phase 4**: Integrate slang LSP
5. **Phase 5**: Implement tool abstraction for lint, simulation

**Priority**: Merge automation → Core structure → Critical agents → Tools

---

## 📝 References

- [slang](https://github.com/MikePopoloski/slang): SystemVerilog compiler and LSP
- [verilator](https://www.veripool.org/verilator/): Fast Verilog/SystemVerilog simulator
- [yosys](https://yosyshq.net/yosys/): Open synthesis suite
- [cocotb](https://www.cocotb.org/): Python-based verification
- [UVM 1.2](https://www.accellera.org/downloads/standards/uvm): Universal Verification Methodology

---

*This architecture is designed to be minimal, extensible, and production-ready for real-world RTL development.*
