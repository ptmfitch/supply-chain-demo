---
name: agile-v-skills-index
description: >-
  Registry of 24 Agile V skills for this repo. Use at session start to pick
  which `.cursor/skills/` skill to load (01/core always; 17 for Next.js;
  19 before claiming done; 23 for Sentry).
---

# Agile V skills registry (24)

**Upstream:** https://github.com/Agile-V/agile_v_skills  
**Load order:** Always `agile-v-core` first, then task-specific skills.

Always-on Cursor rules: `.cursor/rules/agile-v-core.mdc`, `.cursor/rules/project-quick-reference.mdc`.

| # | Skill | V-position | When to load |
|---|-------|------------|--------------|
| 01 | `agile-v-core` | All | Every session |
| 02 | `agile-v-pipeline` | Orchestrate | Full pipeline or multi-REQ waves |
| 03 | `agile-v-lifecycle` | Evolve | C2+ change requests or REQ modifications |
| 04 | `agile-v-compliance` | Verify | Compliance, CAPA, or formal gates |
| 05 | `agile-v-behavioral` | All | When session behavior or halt protocol needs tightening |
| 06 | `agile-v-product-owner` | Specify | Sprint planning or backlog shaping |
| 07 | `agile-v-quality-gates` | Verify | Human Gate 1/2 or eval_gate |
| 08 | `system-understanding` | Gate 0 | Onboarding to an unknown area of the codebase |
| 09 | `impact-analysis` | Constrain | Before a risky or cross-cutting change |
| 10 | `graph-traceability` | Verify | Auditing REQ traceability |
| 11 | `regression-selection` | Prove | Choosing which tests to run |
| 12 | `diff-evidence` | Verify | Comparing expected vs actual diffs |
| 13 | `discovery-analyst` | Specify | Turning research into REQs |
| 14 | `requirement-architect` | Specify | Authoring or splitting REQs |
| 15 | `logic-gatekeeper` | Constrain | Validating REQ logic before build |
| 16 | `build-generic` | Apex | Implementation when JS-specific skill does not apply |
| 17 | `build-js` | Apex | Building or changing this Next.js app |
| 18 | `test-designer` | Apex | Designing tests from a REQ |
| 19 | `red-team-verifier` | Verify | Before claiming done; lint/test/build independently |
| 20 | `compliance-auditor` | Verify | Audit packs and compliance evidence |
| 21 | `threat-modeler` | Specify | Threat modeling a feature |
| 22 | `ux-spec-author` | Specify | UX or a11y specs |
| 23 | `observability-planner` | Prove | Sentry, logging, or observability work |
| 24 | `release-manager` | Verify | Deploy, rollback, or release notes |

**Governance (not skills):** `.agile-v/STATE.md`, `.agile-v/REQUIREMENTS.md`.
