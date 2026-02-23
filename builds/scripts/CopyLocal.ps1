$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

$localDir = "\\thebrewery\Foundry\Data\systems\deathwatch\"

if (Test-Path $localDir) {
    Get-ChildItem $localDir | Remove-Item -Force -Recurse
}

Write-Information "Copy Core Files to '$localDir'"
Get-ChildItem .\src  | Copy-Item -Destination $localDir -Recurse 
Write-Host "Complete at $(Get-Date -Format "HH:mm:ss")"