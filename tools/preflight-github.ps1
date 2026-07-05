Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo

Write-Host "Repository: $repo"
Write-Host "Checking Git..."
git --version
git status --short

Write-Host "Checking Git LFS..."
git lfs version
git lfs track

Write-Host "Running validation..."
npm run validate

Write-Host "Preflight complete."

