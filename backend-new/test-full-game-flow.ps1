# Comprehensive Game Functionality Test
# Tests the entire game flow from registration to gameplay

param(
    [string]$BaseUrl = "https://one000trivia.onrender.com/api"
)

$ErrorActionPreference = "Continue"
$testEmail = "testuser_$(Get-Random)@test.com"
$testPassword = "Test123456!"
$testUsername = "testuser$(Get-Random)"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Comprehensive Game Functionality Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Results Tracking
$results = @{
    total = 0
    passed = 0
    failed = 0
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    
    $results.total++
    Write-Host "Testing: $Name..." -ForegroundColor Yellow
    
    try {
        $result = & $Action
        if ($result.success) {
            Write-Host "[PASS] $Name" -ForegroundColor Green
            $results.passed++
            $results.tests += @{ name = $Name; status = "PASS"; data = $result }
            return $result
        } else {
            Write-Host "[FAIL] $Name - $($result.error)" -ForegroundColor Red
            $results.failed++
            $results.tests += @{ name = $Name; status = "FAIL"; error = $result.error }
            return $null
        }
    } catch {
        Write-Host "[ERROR] $Name - $($_.Exception.Message)" -ForegroundColor Red
        $results.failed++
        $results.tests += @{ name = $Name; status = "ERROR"; error = $_.Exception.Message }
        return $null
    }
}

# Test 1: User Registration
Write-Host "`n--- Test 1: User Registration ---" -ForegroundColor Cyan
$registerResult = Test-Endpoint -Name "Register New User" -Action {
    $body = @{
        email = $testEmail
        password = $testPassword
        username = $testUsername
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

if (-not $registerResult) {
    Write-Host "Registration failed. Cannot continue tests." -ForegroundColor Red
    exit 1
}

$token = $registerResult.data.data.accessToken
$userId = $registerResult.data.data.user.id
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "User ID: $userId" -ForegroundColor Gray
Write-Host ""

# Test 2: Wallet Creation and Info
Write-Host "`n--- Test 2: Wallet Functionality ---" -ForegroundColor Cyan

Test-Endpoint -Name "Get Wallet Info" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/wallet/info" -Method GET -Headers $headers -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 3: Daily Credit Claim
Write-Host "`n--- Test 3: Daily Credits Claim ---" -ForegroundColor Cyan

$claimResult = Test-Endpoint -Name "Claim Daily Credits" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/bonus/claim-daily" -Method POST -Headers $headers -ContentType "application/json" -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

if ($claimResult) {
    Write-Host "  Credits Awarded: $($claimResult.data.data.amount)" -ForegroundColor Gray
    Write-Host "  New Balance: $($claimResult.data.data.newBalance)" -ForegroundColor Gray
}

# Test 4: Verify Balance Update
$walletAfterClaim = Test-Endpoint -Name "Verify Balance After Claim" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/wallet/info" -Method GET -Headers $headers -ErrorAction Stop
        if ($response.data.balance -gt 0) {
            return @{ success = $true; data = $response }
        } else {
            return @{ success = $false; error = "Balance is still 0 after claim" }
        }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 5: Transaction History
Test-Endpoint -Name "Get Transaction History" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/wallet/transactions" -Method GET -Headers $headers -ErrorAction Stop
        if ($response.data.Count -gt 0) {
            return @{ success = $true; data = $response }
        } else {
            return @{ success = $false; error = "No transactions found" }
        }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 6: Game Modes
Write-Host "`n--- Test 4: Game Modes ---" -ForegroundColor Cyan

$gameModesResult = Test-Endpoint -Name "Get Active Game Modes" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/game-modes" -Method GET -Headers $headers -ErrorAction Stop
        if ($response.data.Count -gt 0) {
            return @{ success = $true; data = $response }
        } else {
            return @{ success = $false; error = "No active game modes found" }
        }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 7: Active Periods
$periodsResult = Test-Endpoint -Name "Get Active Periods" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/game-modes/periods/active" -Method GET -Headers $headers -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 8: Start Game Session (if periods available)
if ($periodsResult -and $periodsResult.data.data.Count -gt 0) {
    Write-Host "`n--- Test 5: Game Session ---" -ForegroundColor Cyan
    $period = $periodsResult.data.data[0]
    Write-Host "  Using Period: $($period.id)" -ForegroundColor Gray
    
    $sessionResult = Test-Endpoint -Name "Start Game Session" -Action {
        $body = @{
            periodId = $period.id
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/game/start" -Method POST -Headers $headers -Body $body -ErrorAction Stop
            return @{ success = $true; data = $response }
        } catch {
            return @{ success = $false; error = $_.Exception.Message }
        }
    }
    
    if ($sessionResult) {
        $sessionId = $sessionResult.data.data.session.id
        Write-Host "  Session ID: $sessionId" -ForegroundColor Gray
        
        # Test 9: Get Session
        Test-Endpoint -Name "Get Session Info" -Action {
            try {
                $response = Invoke-RestMethod -Uri "$BaseUrl/game/session/$sessionId" -Method GET -Headers $headers -ErrorAction Stop
                return @{ success = $true; data = $response }
            } catch {
                return @{ success = $false; error = $_.Exception.Message }
            }
        }
        
        # Test 10: Get Question
        $questionResult = Test-Endpoint -Name "Get Next Question" -Action {
            try {
                $response = Invoke-RestMethod -Uri "$BaseUrl/game/session/$sessionId/question" -Method GET -Headers $headers -ErrorAction Stop
                return @{ success = $true; data = $response }
            } catch {
                return @{ success = $false; error = $_.Exception.Message }
            }
        }
        
        # Test 11: Submit Answer
        if ($questionResult) {
            $question = $questionResult.data.data
            $correctAnswer = $question.correctAnswer
            
            Test-Endpoint -Name "Submit Correct Answer" -Action {
                $body = @{
                    questionId = $question.id
                    answer = $correctAnswer
                    timeSpent = 5000
                } | ConvertTo-Json
                
                try {
                    $response = Invoke-RestMethod -Uri "$BaseUrl/game/session/$sessionId/answer" -Method POST -Headers $headers -Body $body -ErrorAction Stop
                    return @{ success = $true; data = $response }
                } catch {
                    return @{ success = $false; error = $_.Exception.Message }
                }
            }
        }
    }
} else {
    Write-Host "`nNo active periods available. Skipping game session tests." -ForegroundColor Yellow
}

# Test 12: Leaderboard
Write-Host "`n--- Test 6: Leaderboard ---" -ForegroundColor Cyan

Test-Endpoint -Name "Get All-Time Leaderboard" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/leaderboard/all-time?limit=10" -Method GET -Headers $headers -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 13: User Profile
Write-Host "`n--- Test 7: User Profile ---" -ForegroundColor Cyan

Test-Endpoint -Name "Get User Profile" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/user/profile" -Method GET -Headers $headers -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

Test-Endpoint -Name "Get User Stats" -Action {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/user/stats" -Method GET -Headers $headers -ErrorAction Stop
        return @{ success = $true; data = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Print Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($results.total)" -ForegroundColor White
Write-Host "Passed: $($results.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.failed)" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($results.passed / $results.total) * 100, 2))%" -ForegroundColor $(if ($results.passed -eq $results.total) { "Green" } else { "Yellow" })
Write-Host ""

# Print Failed Tests Details
if ($results.failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    foreach ($test in $results.tests | Where-Object { $_.status -ne "PASS" }) {
        Write-Host "  - $($test.name): $($test.error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Test completed." -ForegroundColor Cyan
Write-Host "Test user email: $testEmail" -ForegroundColor Gray
Write-Host "Test user password: $testPassword" -ForegroundColor Gray
