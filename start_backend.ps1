#!/usr/bin/env pwsh
<#
start_backend.ps1
Starts Docker Desktop if installed, waits for Docker daemon, then runs docker compose up --build
Run as: PowerShell -ExecutionPolicy Bypass -File .\start_backend.ps1
#>
function Wait-Docker {
    param(
        [int]$TimeoutSec = 300,
        [int]$IntervalSec = 2
    )
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        try {
            docker version > $null 2>&1
            if ($LASTEXITCODE -eq 0) { return $true }
        } catch { }
        Start-Sleep -Seconds $IntervalSec
        $elapsed += $IntervalSec
        Write-Host "Waiting for Docker... ${elapsed}/${TimeoutSec} sec"
    }
    return $false
}

Write-Host "Checking local Docker availability..."
try {
    docker version > $null 2>&1
    $dockerOk = ($LASTEXITCODE -eq 0)
} catch {
    $dockerOk = $false
}

if (-not $dockerOk) {
    $possiblePaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles(x86)\Docker\Docker\Docker Desktop.exe"
    )
    $found = $possiblePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($found) {
        Write-Host "Starting Docker Desktop: $found"
        Start-Process -FilePath $found
        Start-Sleep -Seconds 5
        if (-not (Wait-Docker -TimeoutSec 300 -IntervalSec 3)) {
            Write-Error "Docker did not become available within timeout. Please open Docker Desktop manually."
            exit 1
        }
    } else {
        Write-Error "Docker not available and Docker Desktop not found. Please start Docker Desktop manually and re-run this script."
        exit 1
    }
}

Write-Host "Docker is available. Starting docker compose..."
cd "$PSScriptRoot"
docker compose up --build
