# GitHub PR 控制表

更新時間：2026-07-05T21:04:17.138Z

這個表列出目前已準備好的 GitHub 分支、建議 base branch、smoke evidence 與 PR 建立入口。PR 仍需在 GitHub 網站中建立；本檔只負責提供可追蹤的控制面板。

目前 GitHub pull request refs：0

## 建議 PR 順序

- 先建立 `phase-1-smac-spec-standard`，base 使用 `main`。
- Phase 1 接受後，其餘分支可先以 `phase-1-smac-spec-standard` 作為 base 做 stacked review。
- Phase 1 合併後，再視情況將後續分支 rebase 到 `main` 後建立 PR。

## PR 清單

| # | Category | Branch | Base | Pages | Checks | Failures | PR |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | 電動缸 | `phase-1-smac-spec-standard` | `main` | 14 | 28 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-1-smac-spec-standard) |
| 2 | 驅動器 / ACS 控制器 | `phase-2-drivers-spec-review` | `phase-1-smac-spec-standard` | 30 | 60 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-2-drivers-spec-review) |
| 3 | 各類馬達 | `phase-2-motors-spec-review` | `phase-1-smac-spec-standard` | 24 | 48 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-2-motors-spec-review) |
| 4 | Harmonic Drive 減速機 | `phase-3-harmonic-drive` | `phase-1-smac-spec-standard` | 29 | 58 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-3-harmonic-drive) |
| 5 | Renishaw 回授元件 | `phase-3-renishaw-feedback` | `phase-1-smac-spec-standard` | 35 | 70 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-3-renishaw-feedback) |
| 6 | 定位平台 | `phase-3-positioning-stage` | `phase-1-smac-spec-standard` | 12 | 24 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-3-positioning-stage) |
| 7 | 空氣軸承 / 滾珠滾柱軸承 | `phase-3-bearings-air-mechanical` | `phase-1-smac-spec-standard` | 17 | 34 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-3-bearings-air-mechanical) |
| 8 | 聯軸器 | `phase-4-couplings` | `phase-1-smac-spec-standard` | 16 | 32 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-4-couplings) |
| 9 | FMS 張力系統 | `phase-4-fms-tension` | `phase-1-smac-spec-standard` | 26 | 52 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-4-fms-tension) |
| 10 | 固態繼電器 | `phase-4-solid-state-relays` | `phase-1-smac-spec-standard` | 10 | 20 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-4-solid-state-relays) |
| 11 | 山洋電氣 SANYO DENKI | `phase-4-sanyo-denki` | `phase-1-smac-spec-standard` | 6 | 12 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-4-sanyo-denki) |
| 12 | 特殊環境 | `phase-4-special-environments` | `phase-1-smac-spec-standard` | 11 | 22 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-4-special-environments) |
| 13 | 陶瓷吸盤 | `phase-5-ceramic-chucks` | `phase-1-smac-spec-standard` | 1 | 2 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-5-ceramic-chucks) |
| 14 | SEJINIGB 齒排與轉台 | `phase-5-sejinigb` | `phase-1-smac-spec-standard` | 2 | 4 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-5-sejinigb) |
| 15 | 鼓風機 | `phase-5-blowers` | `phase-1-smac-spec-standard` | 2 | 4 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-5-blowers) |
| 16 | 自動化系統 | `phase-5-automation-systems` | `phase-1-smac-spec-standard` | 5 | 10 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-5-automation-systems) |
| 17 | 其他回授元件 | `phase-5-other-feedback` | `phase-1-smac-spec-standard` | 8 | 16 | 0 | [Create PR](https://github.com/wangpinyu/taiwan-servo-website/pull/new/phase-5-other-feedback) |

## 驗收條件

- 每個 PR 必須通過 `npm run validate`。
- GitHub Actions `Preview QA` 必須通過。
- Smoke failures 必須為 0。
- `source-needed` 頁面不得補寫未經來源支持的規格。
- 後台保存、測試網上架、正式伺服器覆蓋不在本 PR 工作流中執行。

