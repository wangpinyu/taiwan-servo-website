# Source-needed Action Index

Updated: 2026-07-06

This file turns the current `agent-source-needed` audit into executable follow-up work. It does not approve invented specifications. A page can move out of `source-needed` only when an AI agent can point to official manufacturer pages, official PDF tables, or an existing verified local source package.

## Policy

- Do not invent product specifications.
- Keep unsupported values as `—`, `原廠未公開`, or `請洽星泰`.
- Keep software, training, test, and informational pages out of the standard hardware product specification table unless a separate content model is approved.
- If official downloads are too large or server upload is unreliable, link to the official manufacturer download page or official document URL and mark `external-source`.
- Backend upload/save is out of scope for this index. This is for local preview and GitHub workflow preparation only.

## Summary

- Total source-needed pages: 7
- Official source audit queue: 1
- Non-standard product/spec exceptions: 6
- RINGFEDER resolved in prior source audit: 208, 209, 210, 211, 212, 213, 335, 336.
- SANYO DENKI resolved in source audit: 194, 195, 270.
- JVL resolved in source audit: 102.
- Thomson resolved in source audit: 149.
- Still unresolved official-source pages: 215.

## Official Source Audit Queue

These pages can be handled by AI agent source research. The agent must find official manufacturer evidence before creating or revising the `產品規格詳情` module.

| ID | Page | Category | Required source work | Suggested branch |
| --- | --- | --- | --- | --- |
| 215 | RINGFEDER 摩擦彈簧 | 聯軸器 / RINGFEDER 摩擦彈簧 | Decide whether to keep this page under couplings or reframe it as damping technology. Official source classifies it as friction springs. | `source-audit-ringfeder-friction-springs` |

## Non-standard Exceptions

These should not be forced into the standard `產品規格詳情` hardware module without a separate content decision.

| ID | Page | Disposition | Handling |
| --- | --- | --- | --- |
| 241 | 測試-ACS硬體分類 | `exclude-test-page` | Treat as a test/admin remnant. Do not create a public-facing spec module unless the page is confirmed as real. |
| 253 | 軟體-1 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 254 | 軟體-2 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 255 | 軟體-3 | `software-source-needed` | Requires a software-page schema, not the hardware spec table schema. |
| 268 | ACS 特點說明 | `informational-source-needed` | Treat as an ACS feature/information page. Build structured content only after the page role is approved. |
| 269 | ACS 教育訓練影片 | `training-content-no-spec` | Training/video content should use a training resource schema, not product specifications. |

## Source Audit Progress

### RINGFEDER Couplings

- Branch: `source-audit-ringfeder-couplings`
- Evidence package: `docs/source-audits/ringfeder-couplings.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-couplings.json`
- Covered pages: 208, 209, 210, 211, 212, 213, 215, 335, 336
- Current result:
  - `agent-approved-clean`: 208, 209, 210, 211, 212, 213, 335, 336
  - `agent-source-needed`: 215

### SANYO DENKI

- Branch: `source-audit-sanyo-denki`
- Evidence package: `docs/source-audits/sanyo-denki.md`
- Machine-readable evidence: `docs/source-audits/sanyo-denki.json`
- Covered pages: 194, 195, 270
- Current result:
  - `agent-approved-clean`: 194, 195, 270
  - `agent-source-needed`: none in SANYO DENKI

### JVL Motors

- Branch: `source-audit-jvl-motors`
- Evidence package: `docs/source-audits/jvl-motors.md`
- Machine-readable evidence: `docs/source-audits/jvl-motors.json`
- Covered pages: 102
- Current result:
  - `agent-approved-clean`: 102
  - `agent-source-needed`: none in JVL

### Thomson Reducers

- Branch: `source-audit-thomson-reducers`
- Evidence package: `docs/source-audits/thomson-reducers.md`
- Machine-readable evidence: `docs/source-audits/thomson-reducers.json`
- Covered pages: 149
- Current result:
  - `agent-approved-clean`: 149
  - `agent-source-needed`: none in Thomson

## Next Agent Steps

1. Resolve page 215 with an official RINGFEDER friction-spring source audit or keep it as a category/content exception if it should not use the coupling table schema.
2. Keep 241, 253, 254, 255, 268, and 269 as non-standard exceptions until a separate schema is approved.
