# oh-my-claude-rtl 독립 프로젝트 전환 계획

## 목표
oh-my-claudecode를 fork하여 RTL coding/검증 agent를 추가하고, 동적 agent 발견 시스템을 구현하여 확장 가능한 독립 프로젝트로 전환

---

## Phase 1: 동적 Agent 발견 시스템 구현

### 1.1 agents/ 폴더 스캔 기능 추가
- [ ] **파일**: `src/agents/discovery.ts` (신규)
- [ ] agents/ 폴더의 모든 .md 파일 스캔
- [ ] YAML frontmatter 파싱하여 AgentConfig 생성
- [ ] 기존 하드코딩된 definitions.ts와 병합

### 1.2 definitions.ts 수정
- [ ] **파일**: `src/agents/definitions.ts`
- [ ] `getAgentDefinitions()` 함수 수정
- [ ] 하드코딩된 agent + 동적 발견 agent 병합
- [ ] fallback: 동적 로드 실패 시 기존 동작 유지

### 1.3 prompt-generator 연결
- [ ] **파일**: `src/installer/index.ts` 또는 context-injector
- [ ] `generateOrchestratorPrompt()` 실제 호출
- [ ] 생성된 프롬프트를 CLAUDE.md 또는 context에 주입
- [ ] Agent Selection Guide 동적 생성

---

## Phase 2: RTL Agent 추가

### 2.1 RTL Coder Agent
- [ ] **파일**: `agents/rtl-coder.md`
- [ ] 지원 언어: Verilog, SystemVerilog, Chisel, SpinalHDL, SystemC/TLM

```yaml
---
name: rtl-coder
description: RTL/HDL 코딩 전문가 (Verilog, SystemVerilog, Chisel, SpinalHDL, SystemC)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash]
metadata:
  category: implementation
  triggers:
    - domain: RTL
      trigger: "verilog, systemverilog, rtl, hdl, chisel, spinalhdl, systemc, tlm, 회로설계"
  useWhen:
    - RTL/HDL 코드 작성
    - Verilog/SystemVerilog 모듈 구현
    - Chisel/SpinalHDL 하드웨어 생성
    - SystemC/TLM 모델링
---
```

### 2.2 RTL Verifier Agent
- [ ] **파일**: `agents/rtl-verifier.md`
- [ ] 검증 범위: Testbench, Formal Verification (SVA/PSL), UVM/OVM

```yaml
---
name: rtl-verifier
description: RTL 검증 전문가 (Testbench, UVM, Formal Verification)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash]
metadata:
  category: testing
  triggers:
    - domain: Verification
      trigger: "testbench, 검증, simulation, uvm, ovm, formal, sva, assertion"
  useWhen:
    - Testbench 작성
    - UVM/OVM 검증 환경 구축
    - SVA/PSL formal property 작성
    - 시뮬레이션 및 waveform 분석
---
```

### 2.3 RTL Architect Agent (Opus)
- [ ] **파일**: `agents/rtl-architect.md`

```yaml
---
name: rtl-architect
description: RTL 아키텍처 설계 전문가 (마이크로아키텍처, 최적화)
model: opus
tools: [Read, Glob, Grep, WebSearch]
metadata:
  category: analysis
  triggers:
    - domain: Architecture
      trigger: "마이크로아키텍처, rtl 설계, 파이프라인, 최적화"
---
```

### 2.4 추가 고려 Agent
- [ ] `rtl-reviewer`: RTL 코드 리뷰 (lint, coding style)
- [ ] `rtl-coder-low`: 간단한 RTL 수정 (Haiku)

---

## Phase 3: 저장소 URL 변경

모든 `Yeachan-Heo/oh-my-claudecode` → `babyworm/oh-my-claude-rtl`

- [ ] README.md
- [ ] package.json (repository, homepage, bugs)
- [ ] .claude-plugin/marketplace.json
- [ ] docs/REFERENCE.md
- [ ] .github/CLAUDE.md
- [ ] scripts/install.sh
- [ ] src/features/auto-update.ts
- [ ] skills/omc-setup/SKILL.md
- [ ] skills/doctor/SKILL.md
- [ ] skills/help/SKILL.md
- [ ] skills/release/SKILL.md
- [ ] commands/omc-setup.md
- [ ] commands/doctor.md
- [ ] commands/help.md
- [ ] commands/release.md

---

## Phase 4: 테스트 및 검증

### 4.1 동적 발견 테스트
- [ ] `npm run test:run src/__tests__/agent-discovery.test.ts`

### 4.2 빌드 테스트
- [ ] `npm run build`
- [ ] `npm run lint`

### 4.3 통합 테스트
- [ ] RTL agent 호출 테스트
- [ ] 자동 라우팅 동작 확인
- [ ] ralph loop에서 RTL agent 사용 확인

---

## 주요 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `src/agents/discovery.ts` | 신규 생성 - 동적 agent 발견 |
| `src/agents/definitions.ts` | 수정 - 동적 발견 통합 |
| `src/agents/types.ts` | 수정 - metadata 타입 확장 (필요시) |
| `agents/rtl-coder.md` | 신규 생성 |
| `agents/rtl-verifier.md` | 신규 생성 |
| `agents/rtl-architect.md` | 신규 생성 |
| 15개 URL 참조 파일 | 수정 - URL 변경 |
