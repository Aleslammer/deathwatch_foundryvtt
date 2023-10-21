$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

$localDir = "D:\rpg\FoundryVTT\Data\systems\deathwatch\"


Get-ChildItem $localDir | Remove-Item -Force -Recurse

Write-Information "Copy Core Files to '$localDir'"
Get-ChildItem .\src | Copy-Item -Destination $localDir -Recurse 