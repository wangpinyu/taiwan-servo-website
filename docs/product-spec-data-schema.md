# 產品規格詳情資料 Schema

最後更新：2026-07-06

本文件定義產品規格詳情模組的資料結構。所有類別都應優先使用共用 schema，再用資料與配置表達品牌或產品系列差異，避免每一類產品各自硬編碼。

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

用途：放在 accordion 或系列卡片中的摘要資訊，例如行程、推力、解析度、介面、額定容量。不得放未經來源確認的推測值。

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

- 表頭必須保留原廠欄位與單位。
- 缺值使用 `—`、`原廠未公開` 或 `請洽星泰`。
- 不得自行換算或補齊原廠未列出的欄位。
- 型號/Part Number 欄可 sticky；手機版需支援橫向捲動。

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

- PDF、CAD、Manual、Catalog、Drawing、Software 不混用。
- 系列級下載需標明 `scope: 'series'`。
- 型號級下載需標明 `scope: 'model'`。
- 無下載時顯示 `請洽星泰`，不要留空或使用 `href="#"`。
- large-file-risk 是已知伺服器限制，不阻塞本機優化；必要時改連原廠官方下載頁並標示 `external-source`。

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

CTA 不可只用 JavaScript click handler。若可行，使用真實 `<a href>` 連到現有詢問流程。

## 類別套用原則

- 電動缸 / SMAC：accordion + 原廠型號矩陣 + PDF/CAD。
- 驅動器 / ACS：系列比較、控制介面、軸數、軟體/手冊/資料表分離。
- 馬達：馬達種類、電壓、扭矩、速度、尺寸、encoder/driver 對應。
- Harmonic Drive：減速機型式、減速比、額定扭矩、尺寸、CAD/型錄。
- Renishaw：讀頭/尺帶/介面/安裝文件分類，避免混淆相容性。
- 定位平台：行程、精度、負載、軸數、控制器、平台型式。
- 軸承/空氣軸承：尺寸、負載、剛性、材料、環境條件。
