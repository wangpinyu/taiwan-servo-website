# 產品規格詳情資料 Schema

更新日期：2026-07-06

本 schema 用於規格模組的資料整理、人工審查與後續批次生成。它不是要求所有產品類別有完全相同欄位，而是要求所有頁面有一致的資料外框與清楚的缺值策略。

## PageSpecModule

```json
{
  "productId": "374",
  "brand": "SMAC",
  "productName": "SMAC線性加旋轉致動器",
  "categoryPath": ["電動缸", "SMAC"],
  "moduleTitle": "產品規格詳情",
  "sourceStatus": "verified | partial | agent-review | source-needed",
  "series": [],
  "downloads": [],
  "notes": [],
  "updatedAt": "2026-07-06"
}
```

## SeriesSpec

```json
{
  "seriesId": "LAR",
  "seriesName": "LAR",
  "positioning": "標準型線性加旋轉致動器",
  "summary": ["真空貫穿軸心", "力與扭力控制", "Z 軸與 Theta 軸獨立控制"],
  "sourceUrl": "https://...",
  "specTables": [],
  "downloads": [],
  "cta": {
    "label": "詢問此系列",
    "payload": {
      "brand": "SMAC",
      "series": "LAR"
    }
  }
}
```

## SpecTable

```json
{
  "tableTitle": "LAR 原廠型號規格表",
  "sourceLabel": "SMAC official product table",
  "headers": [
    { "key": "partNumber", "label": "Part Number", "unit": "" },
    { "key": "voltage", "label": "Voltage (DC)", "unit": "V" },
    { "key": "stroke", "label": "Stroke (mm)", "unit": "mm" },
    { "key": "peakForce", "label": "Peak Force (N)", "unit": "N" }
  ],
  "rows": []
}
```

## SpecRow

```json
{
  "partNumber": "CBL35-010-55-1",
  "values": {
    "voltage": "24",
    "stroke": "10",
    "peakForce": "15",
    "contForce": "6"
  },
  "downloads": [
    { "type": "pdf", "scope": "series", "label": "PDF", "url": "https://..." },
    { "type": "cad", "scope": "model", "label": "CAD", "url": "https://..." }
  ],
  "availabilityNote": "",
  "reviewStatus": "verified | agent-review | source-needed"
}
```

## DownloadResource

```json
{
  "type": "pdf | cad | manual | catalog | drawing | software | zip | external",
  "scope": "model | series | category",
  "label": "LAR Datasheet",
  "url": "https://...",
  "localPath": "",
  "contentType": "application/pdf",
  "bytes": 0,
  "status": "verified | missing | large-file-risk | external-source | needs-review"
}
```

## 缺值與不確定資料

- 原廠未列出：`原廠未公開`
- 不適用：`—`
- 需要業務確認：`請洽星泰`
- 來源或文件對應不確定：本機審核紀錄標記為 `agent-review` 或 `source-needed`，由 AI agent 先完成來源查核；前台不得出現開發流程文字。

## 類別專用欄位原則

- 馬達：扭矩、轉速、功率、電壓、回授、框號。
- 驅動器：電壓、電流、控制介面、回授支援、安全功能。
- 電動缸：推力、行程、速度、解析度、電壓、結構。
- 減速機：減速比、扭矩、背隙、剛性、尺寸。
- 光學尺 / 回授：解析度、精度、尺帶、讀頭、輸出介面。
- 定位平台：行程、精度、重複精度、負載、速度、軸型。
- 聯軸器：扭矩、孔徑、轉速、偏心、偏角、軸向位移、剛性。

類別專用欄位只能在來源支持時填入，不為了統一版面而推測資料。
