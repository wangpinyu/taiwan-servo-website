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

- Total source-needed pages: 6
- Official source audit queue: 0
- Non-standard product/spec exceptions: 6
- RINGFEDER resolved in source audits: 208, 209, 210, 211, 212, 213, 215, 335, 336.
- SANYO DENKI resolved in source audit: 194, 195, 270.
- JVL resolved in source audit: 102.
- Thomson resolved in source audit: 149.
- Still unresolved official-source pages: none.

## Official Source Audit Queue

No hardware product pages currently require official source audit before a specification table can be created or revised.

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
- Covered pages: 208, 209, 210, 211, 212, 213, 335, 336
- Current result:
  - `agent-approved-clean`: 208, 209, 210, 211, 212, 213, 335, 336
  - `agent-source-needed`: none in this group

### RINGFEDER Friction Springs

- Branch: `source-audit-ringfeder-friction-springs`
- Evidence package: `docs/source-audits/ringfeder-friction-springs.md`
- Machine-readable evidence: `docs/source-audits/ringfeder-friction-springs.json`
- Covered pages: 215
- Current result:
  - `agent-approved-clean`: 215
  - `agent-source-needed`: none in this group

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

1. Keep 241, 253, 254, 255, 268, and 269 as non-standard exceptions until a separate software / informational / training schema is approved.
2. Continue category-level UIUX and SEO optimization from the 242 `agent-approved-clean` hardware/product pages.
