$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

$localDir = "\\thebrewery\Foundry\Data\systems\deathwatch"
$sourceDir = (Resolve-Path ".\src").Path

if (Test-Path $localDir) {
    Write-Information "Cleaning destination directory..."
    Get-ChildItem $localDir | Remove-Item -Force -Recurse
}

Write-Information "Copying files to '$localDir'"

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Cyan
$dirs = Get-ChildItem $sourceDir -Directory -Recurse | Where-Object {
    $_.Name -ne 'packs-source'
}
foreach ($dir in $dirs) {
    $relativePath = $dir.FullName.Substring($sourceDir.Length + 1)
    $targetPath = Join-Path $localDir $relativePath
    if (-not (Test-Path $targetPath)) {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    }
}

# Get files to copy
$excludePatterns = @('*.test.mjs', 'jest.config.mjs', 'package.json', 'package-lock.json', '.gitignore', '.editorconfig')
$files = Get-ChildItem $sourceDir -File -Recurse | Where-Object {
    $exclude = $false
    
    # Exclude packs-source directory
    if ($_.FullName -like "*\packs-source\*") {
        return $false
    }
    
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like $pattern) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

$totalFiles = $files.Count
$current = 0

Write-Host "Copying $totalFiles files..." -ForegroundColor Cyan

foreach ($file in $files) {
    $current++
    $percentage = [math]::Round(($current / $totalFiles) * 100)
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    $targetPath = Join-Path $localDir $relativePath
    
    Write-Progress -Activity "Copying files" -Status "$percentage% Complete" -PercentComplete $percentage -CurrentOperation $file.Name
    Copy-Item $file.FullName -Destination $targetPath -Force
}

Write-Progress -Activity "Copying files" -Completed
Write-Host "Complete! Copied $totalFiles files at $(Get-Date -Format "HH:mm:ss")" -ForegroundColor Green