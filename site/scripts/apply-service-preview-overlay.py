from __future__ import annotations

import datetime as _dt
import html
import json
import os
import re
import shutil
import sys
from pathlib import Path

from bs4 import BeautifulSoup


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


WORKSPACE = Path.cwd()
MIRROR = WORKSPACE / ".codex_tmp" / "site-mirror-current"
PREVIEW_SERVICES = MIRROR / "preview" / "services"
SOURCE = MIRROR / "optimization-sources" / "services-section-2026-07-05T15-28-59-880Z"
REPORTS = MIRROR / "reports"

MAPPING = [
    {"target": "index.html", "source_stem": "07-services-overview", "local_leaf": "index.html"},
    {"target": "detail/7.html", "source_stem": "15-technical-consulting", "local_leaf": "7.html"},
    {"target": "detail/8.html", "source_stem": "08-custom-solution", "local_leaf": "8.html"},
    {"target": "detail/9.html", "source_stem": "09-brand-integration", "local_leaf": "9.html"},
    {"target": "detail/10.html", "source_stem": "10-implementation-support", "local_leaf": "10.html"},
    {"target": "detail/11.html", "source_stem": "11-custom-subsystem", "local_leaf": "11.html"},
    {"target": "detail/12.html", "source_stem": "12-maintenance-upgrade", "local_leaf": "12.html"},
    {"target": "detail/13.html", "source_stem": "13-motion-control-integration", "local_leaf": "13.html"},
]

SERVICE_ID_TO_LOCAL = {
    "15": "7.html",
    "7": "../index.html",
    "8": "8.html",
    "9": "9.html",
    "10": "10.html",
    "11": "11.html",
    "12": "12.html",
    "13": "13.html",
}


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def posix(path: Path) -> str:
    return str(path).replace("\\", "/")


def rel_from(target_file: Path, preview_rel: str) -> str:
    abs_target = MIRROR / preview_rel
    return os.path.relpath(abs_target, start=target_file.parent).replace("\\", "/")


def load_category_map() -> dict[str, str]:
    manifest = read_json(MIRROR / "site-manifest.json")
    category_by_label: dict[str, str] = {}
    for page in manifest.get("pages", []):
        if page.get("type") == "product-category" and page.get("status") == 200:
            label = (page.get("h1") or "").strip()
            if label and label not in category_by_label:
                category_by_label[label] = page.get("preview_rel")
    # Fallbacks cover test-site package links whose numeric IDs differ from the formal mirror.
    for label, rel in {
        "ACS 控制器 / 驅動器": "preview/products/category/75.html",
        "驅動器": "preview/products/category/213.html",
        "各類馬達": "preview/products/category/88.html",
        "Harmonic Drive 減速機": "preview/products/category/93.html",
        "Renishaw 回授元件產品": "preview/products/category/224.html",
        "定位平台": "preview/products/category/137.html",
        "電動缸": "preview/products/category/97.html",
    }.items():
        category_by_label.setdefault(label, rel)
    return category_by_label


def load_metadata() -> dict[str, dict]:
    metadata: dict[str, dict] = {}
    for item in MAPPING:
        path = SOURCE / "metadata" / f"{item['source_stem']}.json"
        metadata[item["source_stem"]] = read_json(path)
    return metadata


def extract_source_content(stem: str) -> BeautifulSoup:
    src_file = SOURCE / "frontend-html" / f"{stem}.html"
    soup = BeautifulSoup(src_file.read_text(encoding="utf-8"), "html.parser")
    editor = soup.select_one("div.editor.article.pd5")
    if not editor:
        raise RuntimeError(f"source editor missing: {src_file}")
    fragment = BeautifulSoup("", "html.parser")
    for child in list(editor.contents):
        fragment.append(child.extract())
    return fragment


def rewrite_fragment_links(fragment: BeautifulSoup, target_file: Path, category_by_label: dict[str, str]) -> None:
    for anchor in fragment.find_all("a"):
        href = anchor.get("href") or ""
        label = anchor.get_text(" ", strip=True)
        if href.startswith("/taiwan_servo/contact") or href.startswith("/contact"):
            anchor["href"] = "#service-contact"
            anchor["data-original-href"] = href
            continue
        if href in ("/taiwan_servo/products", "/products"):
            anchor["href"] = rel_from(target_file, "preview/products/index.html")
            continue
        service_match = re.match(r"^/taiwan_servo/services/detail/(\d+)", href)
        if service_match:
            local = SERVICE_ID_TO_LOCAL.get(service_match.group(1))
            if local:
                if target_file.name == "index.html" and target_file.parent.name == "services":
                    anchor["href"] = "detail/" + local if local.endswith(".html") and local != "../index.html" else "index.html"
                else:
                    anchor["href"] = local if local != "../index.html" else "../index.html"
                continue
        category_match = re.match(r"^/taiwan_servo/products/category/(\d+)", href)
        if category_match:
            preview_rel = category_by_label.get(label)
            if preview_rel:
                anchor["href"] = rel_from(target_file, preview_rel)
            else:
                anchor["href"] = rel_from(target_file, "preview/products/index.html")
                anchor["data-original-href"] = href
            continue
        if href.startswith("/taiwan_servo/"):
            anchor["href"] = "#local-link-unmapped"
            anchor["data-original-href"] = href


def update_page_labels(soup: BeautifulSoup, page_title: str, seo_title: str, seo_desc: str, nav_titles: dict[str, str]) -> None:
    if soup.title:
        soup.title.string = seo_title
    for meta_tag in soup.find_all("meta"):
        prop = meta_tag.get("property")
        name = meta_tag.get("name")
        if prop == "og:title" or name == "twitter:title":
            meta_tag["content"] = page_title
        if (prop == "og:description" or name in ("description", "twitter:description")) and seo_desc:
            meta_tag["content"] = seo_desc
    for anchor in soup.find_all("a"):
        leaf = (anchor.get("href") or "").split("/")[-1]
        if leaf in nav_titles:
            anchor.clear()
            anchor.append(nav_titles[leaf])
            anchor["title"] = nav_titles[leaf]
    path_ul = soup.select_one("main#content div.page .path ul")
    if path_ul:
        items = path_ul.find_all("li", recursive=False)
        if items:
            items[-1].clear()
            items[-1].append(page_title)


def update_json_ld(soup: BeautifulSoup, page_title: str, seo_desc: str) -> None:
    stale_titles = {"客製化解決方案", "應用產業範圍"}

    def update(obj):
        if isinstance(obj, dict):
            for key in ("headline", "name"):
                if key in obj and isinstance(obj[key], str) and (obj[key] in stale_titles or "?" in obj[key]):
                    obj[key] = page_title
            if "description" in obj and seo_desc:
                obj["description"] = seo_desc
            for value in obj.values():
                update(value)
        elif isinstance(obj, list):
            for value in obj:
                update(value)

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue
        update(data)
        script.string = json.dumps(data, ensure_ascii=False, indent=2)


def render_html_report(report: dict) -> str:
    rows = []
    for item in report["results"]:
        rows.append(
            "<tr>"
            f"<td>{html.escape(item['target'])}</td>"
            f"<td>{html.escape(item.get('title', ''))}</td>"
            f"<td>{html.escape(item.get('html_title', ''))}</td>"
            f"<td>{html.escape(item.get('article_h1', ''))}</td>"
            f"<td>{html.escape(item.get('breadcrumb', ''))}</td>"
            f"<td>{'OK' if item.get('ok') else 'FAIL'}</td>"
            "</tr>"
        )
    return f"""<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>服務內容套用報告</title>
<style>body{{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:0;background:#f6f8f7;color:#15251d}}header{{background:#0b8e43;color:#fff;padding:22px 28px}}main{{max-width:1180px;margin:auto;padding:22px}}a{{color:#087d3d}}table{{width:100%;border-collapse:collapse;background:#fff}}td,th{{padding:9px;border-bottom:1px solid #dbe6de;text-align:left;vertical-align:top}}th{{background:#eaf4ee}}.card{{background:white;border:1px solid #d9e5de;border-radius:8px;padding:18px;margin:16px 0}}code{{background:#eef5f0;padding:2px 5px;border-radius:4px}}</style>
</head><body><header><h1>服務內容套用報告</h1></header><main>
<p><a href="../index.html">回主控面板</a> · <a href="service-preview-apply-report.json">查看 JSON</a></p>
<section class="card"><p>已將服務優化內容套入本機 preview。此流程會在 mirror rebuild 結尾自動執行。</p>
<p>來源：<code>{html.escape(report['source_package'])}</code></p></section>
<table><thead><tr><th>本機頁</th><th>頁面名稱</th><th>HTML title</th><th>內容 H1</th><th>breadcrumb</th><th>狀態</th></tr></thead><tbody>{''.join(rows)}</tbody></table>
</main></body></html>"""


def main() -> int:
    for required in (MIRROR, PREVIEW_SERVICES, SOURCE):
        if not required.exists():
            raise RuntimeError(f"required path missing: {required}")
    metadata = load_metadata()
    category_by_label = load_category_map()
    nav_titles = {
        item["local_leaf"]: metadata[item["source_stem"]].get("tw_name") or metadata[item["source_stem"]].get("frontend_h1") or ""
        for item in MAPPING
        if item["local_leaf"] != "index.html"
    }
    results = []
    for item in MAPPING:
        target_file = PREVIEW_SERVICES / item["target"]
        target_file.parent.mkdir(parents=True, exist_ok=True)
        meta = metadata[item["source_stem"]]
        page_title = meta.get("tw_name") or meta.get("frontend_h1") or item["source_stem"]
        seo_title = meta.get("seo_title") or meta.get("frontend_title") or page_title
        seo_desc = meta.get("seo_description") or ""
        soup = BeautifulSoup(target_file.read_text(encoding="utf-8"), "html.parser")
        editor = soup.select_one("div.editor.article.pd5")
        if not editor:
            raise RuntimeError(f"target editor missing: {target_file}")
        fragment = extract_source_content(item["source_stem"])
        rewrite_fragment_links(fragment, target_file, category_by_label)
        editor.clear()
        for child in list(fragment.contents):
            editor.append(child.extract())
        update_page_labels(soup, page_title, seo_title, seo_desc, nav_titles)
        update_json_ld(soup, page_title, seo_desc)
        target_file.write_text(str(soup), encoding="utf-8")

        readback = BeautifulSoup(target_file.read_text(encoding="utf-8"), "html.parser")
        article = readback.select_one("article.st-services")
        hrefs = [anchor.get("href") or "" for anchor in readback.find_all("a")]
        breadcrumb = readback.select_one("main#content .path ul")
        html_title = readback.title.string if readback.title else ""
        result = {
            "target": item["target"],
            "title": page_title,
            "html_title": html_title,
            "article_h1": article.find("h1").get_text(" ", strip=True) if article and article.find("h1") else "",
            "breadcrumb": breadcrumb.get_text(" > ", strip=True) if breadcrumb else "",
            "ok": bool(article and "?" not in html_title),
            "taiwan_servo_href_count": sum(href.startswith("/taiwan_servo/") for href in hrefs),
            "formal_host_href_count": sum("taiwan-servo.com.tw" in href for href in hrefs),
            "file_path_text": bool(re.search(r"F:\\|C:\\|file:///", readback.get_text(" ", strip=True))),
            "details_count": len(readback.find_all("details")),
            "service_style_count": len([style for style in readback.find_all("style") if "st-services" in style.get_text()]),
        }
        results.append(result)

    report = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "status": "completed" if all(item["ok"] for item in results) else "needs-review",
        "source_package": posix(SOURCE),
        "results": results,
    }
    write_json(REPORTS / "service-preview-apply-report.json", report)
    (REPORTS / "service-preview-apply-report.html").write_text(render_html_report(report), encoding="utf-8")
    print(json.dumps({
        "status": report["status"],
        "pages": len(results),
        "report": "reports/service-preview-apply-report.html",
        "json": "reports/service-preview-apply-report.json",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
