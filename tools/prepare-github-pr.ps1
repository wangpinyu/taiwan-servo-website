param(
  [string]$Branch = 'phase-1-smac-spec-standard'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$indexPath = Join-Path $repoRoot 'site\reports\github-prs\index.json'

if (-not (Test-Path -LiteralPath $indexPath)) {
  throw "Missing PR index: $indexPath. Run npm run workflow:pr-index first."
}

$index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8 | ConvertFrom-Json
$entry = $index.entries | Where-Object { $_.branch -eq $Branch } | Select-Object -First 1
if (-not $entry) {
  throw "Branch not found in PR index: $Branch"
}

$bodyPath = Join-Path $repoRoot ("site\reports\github-prs\{0}.md" -f $Branch)
if (-not (Test-Path -LiteralPath $bodyPath)) {
  throw "Missing PR body: $bodyPath"
}

$body = Get-Content -LiteralPath $bodyPath -Raw -Encoding UTF8
$title = ("{0}: {1}" -f $entry.branch, $entry.category)

Set-Clipboard -Value $body
Start-Process $entry.prUrl

Write-Host "Opened PR page:"
Write-Host $entry.prUrl
Write-Host ""
Write-Host "Suggested title:"
Write-Host $title
Write-Host ""
Write-Host "Base branch:"
Write-Host $entry.base
Write-Host ""
Write-Host "PR body copied to clipboard from:"
Write-Host $bodyPath
