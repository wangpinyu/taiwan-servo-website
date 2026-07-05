param(
  [switch]$All,
  [string]$Branch
)

$ErrorActionPreference = 'Stop'

$indexPath = Join-Path $PSScriptRoot '..\site\reports\github-prs\index.json'
if (-not (Test-Path -LiteralPath $indexPath)) {
  throw "Missing PR index: $indexPath. Run npm run workflow:pr-index first."
}

$index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8 | ConvertFrom-Json

if ($Branch) {
  $entries = @($index.entries | Where-Object { $_.branch -eq $Branch })
  if ($entries.Count -eq 0) {
    throw "Branch not found in PR index: $Branch"
  }
} elseif ($All) {
  $entries = @($index.entries)
} else {
  $entries = @($index.entries | Where-Object { $_.priority -eq 1 })
}

foreach ($entry in $entries) {
  Write-Host ("Opening PR page: {0} -> {1}" -f $entry.branch, $entry.prUrl)
  Start-Process $entry.prUrl
  Start-Sleep -Milliseconds 350
}

Write-Host "Opened $($entries.Count) PR page(s). Review title/body/base branch in GitHub before creating each PR."
