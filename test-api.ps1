# Test API Script for Chapter Generation
# Windows PowerShell script to test story creation endpoint

Write-Host "=== Infinite Pages API Test ===" -ForegroundColor Cyan
Write-Host ""

# Check for saved access token first
$tokenFile = "test-token.txt"
$accessToken = $null

if (Test-Path $tokenFile) {
    Write-Host "Found saved access token in test-token.txt" -ForegroundColor Green
    $accessToken = Get-Content $tokenFile -Raw
    Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "No saved token found." -ForegroundColor Yellow
    Write-Host "Please run .\test-login.ps1 first to authenticate." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can use service role key for testing..." -ForegroundColor Gray
    Write-Host ""

    # Fallback to service role key
    $envFile = ".env.local"

    if (-Not (Test-Path $envFile)) {
        Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
        Write-Host "Please make sure you're running this script from the project root directory." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Reading .env.local..." -ForegroundColor Gray

    # Parse .env.local and extract SUPABASE_SERVICE_ROLE_KEY
    $serviceRoleKey = $null
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)$') {
            $serviceRoleKey = $matches[1].Trim()
        }
    }

    if (-Not $serviceRoleKey) {
        Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local" -ForegroundColor Red
        Write-Host "Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file" -ForegroundColor Yellow
        exit 1
    }

    $accessToken = $serviceRoleKey
    Write-Host "Using SUPABASE_SERVICE_ROLE_KEY: $($serviceRoleKey.Substring(0, 20))..." -ForegroundColor Yellow
    Write-Host ""
}

# Prepare request
$apiUrl = "http://localhost:3001/api/stories"
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$body = @{
    title = "Test Story"
    genre = "fantasy"
    premise = "A young wizard discovers magic in a world where it was thought to be extinct"
} | ConvertTo-Json

Write-Host "Making POST request to: $apiUrl" -ForegroundColor Cyan
Write-Host "Headers:" -ForegroundColor Gray
Write-Host "  Authorization: Bearer $($serviceRoleKey.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  Content-Type: application/json" -ForegroundColor Gray
Write-Host ""
Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray
Write-Host ""
Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host ""

# Make the request
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body -ContentType "application/json"

    Write-Host "SUCCESS! Response received:" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== RESPONSE ===" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""

    # Extract key information
    if ($response.story) {
        Write-Host "=== STORY DETAILS ===" -ForegroundColor Cyan
        Write-Host "Story ID: $($response.story.id)" -ForegroundColor Green
        Write-Host "Title: $($response.story.title)" -ForegroundColor White
        Write-Host "Genre: $($response.story.genre)" -ForegroundColor White
        Write-Host "Tokens Used: $($response.tokensUsed)" -ForegroundColor Yellow
        Write-Host "Remaining Tokens: $($response.remainingTokens)" -ForegroundColor Yellow
        Write-Host ""

        # Save story ID for next test
        $response.story.id | Out-File -FilePath "test-story-id.txt" -NoNewline
        Write-Host "Story ID saved to test-story-id.txt" -ForegroundColor Gray
    }

} catch {
    Write-Host "ERROR: Request failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    # Try to get response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()

        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }

    exit 1
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
