# Setup Admin and Test Users Functionality
$baseUrl = "https://one000trivia.onrender.com/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Admin Setup & Users Search Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Admin emails configured in system:" -ForegroundColor Yellow
Write-Host "  - admin@1000ravier.com" -ForegroundColor White
Write-Host "  - support@1000ravier.com" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Do you want to (1) Register new admin user or (2) Login with existing admin? Enter 1 or 2"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "=== Registering Admin User ===" -ForegroundColor Yellow
    $email = Read-Host "Enter admin email (must match one from above)"
    $password = Read-Host "Enter password (min 8 chars)" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    $username = Read-Host "Enter username"

    $registerBody = @{
        email = $email
        password = $passwordPlain
        username = $username
    } | ConvertTo-Json

    try {
        Write-Host "Registering user..." -ForegroundColor Gray
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody -ErrorAction Stop
        
        Write-Host "[OK] Registration successful!" -ForegroundColor Green
        $token = $registerResponse.data.accessToken
    } catch {
        Write-Host "[FAIL] Registration failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        exit 1
    }
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "=== Login as Admin ===" -ForegroundColor Yellow
    $email = Read-Host "Enter admin email"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    try {
        Write-Host "Logging in..." -ForegroundColor Gray
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
        
        Write-Host "[OK] Login successful!" -ForegroundColor Green
        $token = $loginResponse.data.accessToken
    } catch {
        Write-Host "[FAIL] Login failed!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        exit 1
    }
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Testing Users Search ===" -ForegroundColor Yellow
$testSearch = Read-Host "Do you want to test the users search now? (y/n)"

if ($testSearch -eq "y") {
    $searchQuery = Read-Host "Enter search query (email or user ID, min 2 chars)"
    
    if ($searchQuery.Length -lt 2) {
        Write-Host "[FAIL] Query must be at least 2 characters" -ForegroundColor Red
        exit 1
    }

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    try {
        $searchUrl = '{0}/admin/users/search?q={1}&limit=20' -f $baseUrl, $searchQuery
        Write-Host "Searching for users..." -ForegroundColor Gray
        
        $searchResponse = Invoke-RestMethod -Uri $searchUrl -Method GET -Headers $headers -ErrorAction Stop
        
        Write-Host "[OK] Search successful!" -ForegroundColor Green
        Write-Host ""
        
        if ($searchResponse.data.Count -eq 0) {
            Write-Host "No users found." -ForegroundColor Yellow
        } else {
            Write-Host "Found $($searchResponse.data.Count) user(s):" -ForegroundColor Green
            Write-Host ""
            
            foreach ($user in $searchResponse.data) {
                Write-Host "------------------------" -ForegroundColor Gray
                Write-Host "User ID       : $($user.id)" -ForegroundColor White
                Write-Host "Email         : $($user.email)" -ForegroundColor White
                Write-Host "Verified      : $($user.email_verified)" -ForegroundColor White
                Write-Host "Created       : $($user.created_at)" -ForegroundColor White
                Write-Host "Last Active   : $($user.last_active_at)" -ForegroundColor White
                Write-Host "Earnings (NGN): $($user.lifetime_earnings_ngn)" -ForegroundColor White
            }
            Write-Host "------------------------" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Full JSON Response:" -ForegroundColor Cyan
        $searchResponse | ConvertTo-Json -Depth 10
        
    } catch {
        Write-Host "[FAIL] Search failed!" -ForegroundColor Red
        Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
