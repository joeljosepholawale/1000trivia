# Test script for Admin Users Search functionality
# This script tests the GET /admin/users/search endpoint

# Configuration
$baseUrl = "https://one000trivia.onrender.com/api"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Admin Users Search Endpoint" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as admin to get auth token
Write-Host "Step 1: Authenticating as admin..." -ForegroundColor Yellow
$adminEmail = Read-Host "Enter admin email"
$adminPassword = Read-Host "Enter admin password" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

$loginBody = @{
    email = $adminEmail
    password = $adminPasswordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $token = $loginResponse.data.accessToken
    Write-Host "✓ Authentication successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Authentication failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 2: Test users search endpoint
Write-Host "Step 2: Testing users search endpoint..." -ForegroundColor Yellow
$searchQuery = Read-Host "Enter search query (email or user ID, min 2 characters)"

if ($searchQuery.Length -lt 2) {
    Write-Host "✗ Search query must be at least 2 characters" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Searching for users with query: '$searchQuery'..." -ForegroundColor Gray
    
    $searchUrl = '{0}/admin/users/search?q={1}&limit=20' -f $baseUrl, $searchQuery
    $searchResponse = Invoke-RestMethod -Uri $searchUrl `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Search successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Cyan
    Write-Host "========" -ForegroundColor Cyan
    
    if ($searchResponse.data.Count -eq 0) {
        Write-Host "No users found matching query '$searchQuery'" -ForegroundColor Yellow
    } else {
        Write-Host "Found $($searchResponse.data.Count) user(s):" -ForegroundColor Green
        Write-Host ""
        
        foreach ($user in $searchResponse.data) {
            Write-Host "User ID: $($user.id)" -ForegroundColor White
            Write-Host "Email: $($user.email)" -ForegroundColor White
            Write-Host "Email Verified: $($user.email_verified)" -ForegroundColor White
            Write-Host "Created At: $($user.created_at)" -ForegroundColor White
            Write-Host "Last Active: $($user.last_active_at)" -ForegroundColor White
            Write-Host "Lifetime Earnings (NGN): $($user.lifetime_earnings_ngn)" -ForegroundColor White
            Write-Host "---" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor Cyan
    $searchResponse | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "✗ Search failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details:" -ForegroundColor Red
        $_.ErrorDetails.Message
    }
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
