# 服務項目本機下載包

來源：測試網服務頁前台 fallback 下載。

本次執行時外部 Edge/CDP 可連線，但後台 `Applications/edit/*` 已轉向 `/newadmin/login`，所以沒有取得後台 hidden 欄位的即時 readback。此包內 `backend-content/` 保存的是前台實際渲染出的 `data-codex-services="20260705-refine"` 服務內容 wrapper，可作為本機優化與再上架的內容基準；若需要精準後台 `tw_content` / SEO hidden 欄位，請登入後台後再重跑下載腳本。

下載時間：2026-07-05T15:29:03.624Z

## 內容

- backend-content/: 每頁後台 `tw_content` HTML，可作為後續本機優化與回貼來源。
- frontend-html/: 測試網前台完整 HTML 快照，用於比對實際渲染。
- metadata/: 每頁後台欄位、SEO 欄位、前台 URL 與基本檢查。
- services-backend-records.json: 彙整資料。
- index.html: 本機總覽入口。

## 頁面

- 7 服務項目: https://new.da-vinci.com.tw/taiwan_servo/services
- 15 技術諮詢與系統規劃: https://new.da-vinci.com.tw/taiwan_servo/services/detail/15
- 13 精密運動控制系統整合: https://new.da-vinci.com.tw/taiwan_servo/services/detail/13
- 8 非標準需求評估與方案規劃: https://new.da-vinci.com.tw/taiwan_servo/services/detail/8
- 9 國際品牌代理與產品整合: https://new.da-vinci.com.tw/taiwan_servo/services/detail/9
- 10 快速導入與技術支援: https://new.da-vinci.com.tw/taiwan_servo/services/detail/10
- 11 客製子系統設計與組裝: https://new.da-vinci.com.tw/taiwan_servo/services/detail/11
- 12 維修保固與升級服務: https://new.da-vinci.com.tw/taiwan_servo/services/detail/12
