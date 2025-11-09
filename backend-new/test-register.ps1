$body = @{
    email = "testuser$(Get-Random)@example.com"
    password = "Test1234!"
    username = "testuser$(Get-Random)"
} | ConvertTo-Json

Write-Host "Testing registration endpoint..."
Write-Host "URL: https://one000trivia.onrender.com/api/auth/register"
Write-Host "Request body: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://one000trivia.onrender.com/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "SUCCESS! Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR! Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Error message: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Error details:"
        $_.ErrorDetails.Message
    }
}
