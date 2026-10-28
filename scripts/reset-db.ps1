<#
.SYNOPSIS
    Reset the local BTON database.

.DESCRIPTION
    Drops and recreates the application database. Schema and demo data are
    recreated automatically by Flyway the next time the backend starts, so this
    is the only reset step you need. Never edit applied migration files.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/reset-db.ps1
    powershell -ExecutionPolicy Bypass -File scripts/reset-db.ps1 -Force
#>
param(
    [string]$MySqlHost = "localhost",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = $env:SPRING_DATASOURCE_PASSWORD,
    [string]$Database = "bton_db",
    [string]$MySqlExe = "mysql",
    [switch]$Force
)

if (-not $Password) { $Password = "1234" }

# Resolve mysql.exe: PATH first, then common Windows install locations.
if (-not (Get-Command $MySqlExe -ErrorAction SilentlyContinue)) {
    $candidates = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe"
    )
    $found = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $found) {
        throw "mysql.exe not found. Pass -MySqlExe <path-to-mysql.exe>."
    }
    $MySqlExe = $found
}

if (-not $Force) {
    $answer = Read-Host "This will DROP database '$Database'. Type YES to continue"
    if ($answer -ne "YES") {
        Write-Host "Cancelled."
        exit 1
    }
}

$sql = "DROP DATABASE IF EXISTS $Database; CREATE DATABASE $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

& $MySqlExe -h $MySqlHost -P $Port -u $User "-p$Password" -e $sql
if ($LASTEXITCODE -ne 0) {
    throw "mysql failed with exit code $LASTEXITCODE"
}

Write-Host "Database '$Database' reset."
Write-Host "Start the backend now - Flyway will apply V1..VN automatically."
