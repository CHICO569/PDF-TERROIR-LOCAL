#!/usr/bin/env pwsh
<#
test_api.ps1
Quick smoke test of the PDF Manager API
Tests basic endpoint connectivity
#>

$BASE_URL = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PDF Manager API Smoke Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description
    )
    
    $url = "$BASE_URL$Endpoint"
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method $Method -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  Status: $($response.StatusCode) OK" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 400 -or $statusCode -eq 405) {
            Write-Host "  Status: $statusCode (Expected for POST without file)" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

Write-Host "Checking API availability (5 sec timeout)..." -ForegroundColor Cyan
Write-Host ""

$results = @()
$results += Test-Endpoint -Method "POST" -Endpoint "/api/ocr" -Description "OCR endpoint"
$results += Test-Endpoint -Method "POST" -Endpoint "/api/convert/pdf-to-word" -Description "PDF to Word"
$results += Test-Endpoint -Method "POST" -Endpoint "/api/pdf/merge" -Description "PDF merge"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = $results.Count
$color = if ($passed -eq $total) { "Green" } else { "Yellow" }
Write-Host "Summary: $passed/$total endpoints reachable" -ForegroundColor $color
Write-Host "========================================" -ForegroundColor Cyan

if ($passed -eq $total) {
    Write-Host "Backend is running and responding!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "Some endpoints may not be available. Check Docker logs." -ForegroundColor Yellow
    exit 1
}
