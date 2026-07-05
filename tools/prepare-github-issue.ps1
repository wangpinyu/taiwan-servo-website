param(
  [string]$Branch,
  [int]$Priority,
  [string]$IssueFile
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$indexPath = Join-Path $repoRoot 'site\reports\github-issues\index.json'

if (-not (Test-Path -LiteralPath $indexPath)) {
  throw "Issue index not found. Run npm run workflow:issue-index first."
}

$index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8 | ConvertFrom-Json
$entry = $null

if ($Branch) {
  $entry = $index.entries | Where-Object { $_.branch -eq $Branch } | Select-Object -First 1
} elseif ($Priority) {
  $entry = $index.entries | Where-Object { [int]$_.priority -eq $Priority } | Select-Object -First 1
} elseif ($IssueFile) {
  $normalized = $IssueFile -replace '\\', '/'
  $entry = $index.entries | Where-Object { $_.issueDraft -like "*$normalized" -or (Split-Path $_.issueDraft -Leaf) -eq (Split-Path $IssueFile -Leaf) } | Select-Object -First 1
} else {
  $entry = $index.entries | Select-Object -First 1
}

if (-not $entry) {
  throw "No matching issue entry. Provide -Branch, -Priority, or -IssueFile."
}

$draftPath = Join-Path $repoRoot ($entry.issueDraft -replace '/', '\')
if (-not (Test-Path -LiteralPath $draftPath)) {
  throw "Issue draft not found: $draftPath"
}

$body = Get-Content -LiteralPath $draftPath -Raw -Encoding UTF8
Set-Clipboard -Value $body

Start-Process $entry.issueNewUrl

Write-Host "Opened issue URL: $($entry.issueNewUrl)"
Write-Host "Suggested title: $($entry.title)"
Write-Host "Labels: $($entry.labels -join ', ')"
Write-Host "Draft copied to clipboard: $draftPath"
