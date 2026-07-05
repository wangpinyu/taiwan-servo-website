# 產品規格詳情資料 Schema

更新日期：2026-07-06

本文件定義產品規格詳情模組的資料結構。schema 的目標是讓不同品牌與產品類別共用同一套資料語言，透過配置處理差異，而不是每頁硬編不同版型。

## PageSpecModule

```ts
export interface PageSpecModule {
  productId: string;
  brand?: string;
  productName: string;
  categoryPath: string[];
  moduleTitle: '產品規格詳情';
  sourceStatus: SourceStatus;
  dataCompleteness: DataCompleteness;
  reviewStatus: ReviewStatus;
  series: ProductSpecSeries[];
  downloads?: ProductDownload[];
  notes?: string[];
  updatedAt: string;
}
```

## 狀態型別

```ts
export type SourceStatus =
  | 'verified'
  | 'partial'
  | 'agent-review'
  | 'source-needed'
  | 'external-source';

export type DataCompleteness =
  | 'complete'
  | 'partial'
  | 'catalog-only'
  | 'model-matrix-only'
  | 'needs-confirmation';

export type ReviewStatus =
  | 'agent-approved-clean'
  | 'agent-fix-required'
  | 'agent-structure-review'
  | 'agent-source-audit-needed'
  | 'agent-source-needed';
```

## ProductSpecSeries

```ts
export interface ProductSpecSeries {
  seriesId: string;
  seriesName: string;
  productType?: string;
  positioning?: string;
  summary?: string;
  bestFor?: string[];
  sourceLabel?: string;
  sourceUrl?: string;
  sourceStatus: SourceStatus;
  dataCompleteness: DataCompleteness;
  quickSpecs?: QuickSpec[];
  specTables: SpecTable[];
  downloads?: ProductDownload[];
  cta?: InquiryCta;
  notes?: string[];
}
```

## QuickSpec

```ts
export interface QuickSpec {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}
```

QuickSpec 用於 accordion 或系列卡片中的摘要規格。只放確定且對選型有幫助的欄位，例如行程、推力、扭矩、解析度、通訊介面、尺寸或負載。沒有來源的值不可補寫。

## SpecTable

```ts
export interface SpecTable {
  tableTitle: string;
  sourceLabel?: string;
  sourceUrl?: string;
  columns: SpecColumn[];
  rows: SpecRow[];
  notes?: string[];
}

export interface SpecColumn {
  key: string;
  label: string;
  unit?: string;
  priority?: 'primary' | 'secondary' | 'hidden-mobile';
  sticky?: boolean;
}

export interface SpecRow {
  modelNumber?: string;
  partNumber?: string;
  values: Record<string, string | number | null>;
  downloads?: ProductDownload[];
  inquiryLabel?: string;
  note?: string;
  reviewStatus?: ReviewStatus;
}
```

表格規則：

- 表頭保留原廠欄位與單位。
- 第一欄應是系列、型號或 Part Number 等可識別欄位。
- 缺值使用 `—`、`原廠未公開` 或 `請洽星泰`，不得猜測。
- 不把內部 TODO 或開發註解放進前台。

## ProductDownload

```ts
export type DownloadType =
  | 'pdf'
  | 'cad'
  | 'manual'
  | 'catalog'
  | 'drawing'
  | 'software'
  | 'selection-guide'
  | 'zip'
  | 'external'
  | 'other';

export interface ProductDownload {
  type: DownloadType;
  label: string;
  url?: string;
  scope: 'model' | 'series' | 'category';
  modelNumber?: string;
  contentType?: string;
  bytes?: number;
  status: DownloadStatus;
  note?: string;
}

export type DownloadStatus =
  | 'verified'
  | 'missing'
  | 'large-file-risk'
  | 'external-source'
  | 'needs-review';
```

下載連結規則：

- PDF、CAD、Manual、Catalog、Drawing、Software 必須分類清楚。
- 系列級下載使用 `scope: 'series'`。
- 型號級下載使用 `scope: 'model'`。
- 無下載時顯示 `請洽星泰`，不要使用 `href="#"`。
- `large-file-risk` 是已知伺服器問題，不阻塞本機優化；若本機或後台上傳不穩，優先使用原廠官方下載頁或官方文件 URL，並標示 `external-source`。

## InquiryCta

```ts
export interface InquiryCta {
  label: string;
  href: string;
  payload?: {
    productId?: string;
    brand?: string;
    series?: string;
    modelNumber?: string;
  };
}
```

CTA 必須是可爬取、可點擊的真實 `<a href>` 或既有詢問流程入口。若暫時無法帶入型號，把限制記錄在報告，不放在前台。

## 類別差異處理

- 電動缸 / SMAC：accordion + 原廠型號表 + PDF/CAD。
- 驅動器 / ACS：控制軸數、通訊介面、I/O、電源、支援馬達與軟體。
- 馬達：系列、額定功率/扭矩、電壓、尺寸、速度、編碼器或驅動器搭配。
- Harmonic Drive：系列、減速比、額定扭矩、容許峰值扭矩、背隙、CAD/尺寸圖。
- Renishaw：讀頭、尺帶/圓環、解析度、精度、介面、安裝文件。
- 定位平台：行程、負載、精度、重複精度、驅動方式、控制器。
- 軸承與空氣軸承：尺寸、負載、剛性、材質、應用與 CAD。
