# 產品規格詳情資料 Schema

更新日期：2026-07-06

本 schema 用於描述產品頁 `產品規格詳情` 模組的資料結構。原則是支援不同品牌與產品類型，但不編造原廠未提供的規格。

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

QuickSpec 用於 accordion 或卡片中的快速辨識資訊，例如行程、推力、扭矩、解析度、尺寸、通訊介面等。只能使用官方來源或既有資料中可確認的值。

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

- 使用真正 `<table>`，不得使用 div 偽表格。
- 表頭保留官方欄位與單位。
- 型號或 Part Number 欄位建議作為第一欄。
- 官方未提供的欄位不得自行推測。
- 缺值可使用 `—`、`原廠未公開` 或 `請洽星泰`。
- 不得將內部 TODO 或工作註解顯示在前台。

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

下載規則：

- PDF、CAD、Manual、Catalog、Drawing、Software 必須分類清楚。
- 系列級下載使用 `scope: 'series'`。
- 型號級下載使用 `scope: 'model'`。
- 無下載時顯示 `請洽星泰`，不得留下空連結或 `href="#"`。
- `large-file-risk` 是已知伺服器問題，不阻塞本機優化；必要時改用官方外部連結並標記 `external-source`。

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

CTA 必須使用既有可用詢問流程。如果目前無法帶入型號或系列，限制應寫入報告，不得放成前台可見 TODO。

## 類別差異

- SMAC / 電動缸：accordion、快速規格、型號矩陣表、PDF/CAD。
- 驅動器 / ACS：軸數、電流、電壓、I/O、通訊、支援馬達。
- 馬達：系列、電壓、功率、扭矩、速度、安裝尺寸、編碼器。
- Harmonic Drive：系列、減速比、額定扭矩、背隙、CAD / drawing。
- Renishaw：量測類型、解析度、精度、介面、文件分類。
- 定位平台：行程、負載、精度、重複精度、驅動方式。
- 軸承 / 空氣軸承：尺寸、負載、剛性、材質、CAD。
