# Validates every skills/<dir>/SKILL.md in this repo.
# Exit 0 = all valid. Exit 1 = at least one problem, printed above.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$skillsDir = Join-Path $root 'skills'
$problems = @()

if (-not (Test-Path $skillsDir)) {
    Write-Output "FAIL: no skills directory at $skillsDir"
    exit 1
}

$dirs = Get-ChildItem $skillsDir -Directory
if ($dirs.Count -eq 0) {
    Write-Output "FAIL: skills directory is empty"
    exit 1
}

foreach ($d in $dirs) {
    $file = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path $file)) {
        $problems += "FAIL $($d.Name): no SKILL.md"
        continue
    }

    $lines = Get-Content $file -Encoding utf8
    if ($lines.Count -lt 4 -or $lines[0].Trim() -ne '---') {
        $problems += "FAIL $($d.Name): first line is not '---'"
        continue
    }

    $close = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { $close = $i; break }
    }
    if ($close -lt 0) {
        $problems += "FAIL $($d.Name): frontmatter is not closed"
        continue
    }

    $fm = $lines[1..($close - 1)]
    $nameLine = $fm | Where-Object { $_ -match '^name:\s*(.+)$' } | Select-Object -First 1
    $descLine = $fm | Where-Object { $_ -match '^description:\s*(.+)$' } | Select-Object -First 1

    if (-not $nameLine) { $problems += "FAIL $($d.Name): no name in frontmatter"; continue }
    if (-not $descLine) { $problems += "FAIL $($d.Name): no description in frontmatter"; continue }

    $name = ([regex]::Match($nameLine, '^name:\s*(.+)$')).Groups[1].Value.Trim()
    $desc = ([regex]::Match($descLine, '^description:\s*(.+)$')).Groups[1].Value.Trim()

    if ($name -ne $d.Name) {
        $problems += "FAIL $($d.Name): frontmatter name '$name' does not match directory"
        continue
    }
    if ($desc.Length -lt 40) {
        $problems += "FAIL $($d.Name): description is too short to drive invocation ($($desc.Length) chars)"
        continue
    }
    if ($desc -notmatch '(?i)use when') {
        $problems += "FAIL $($d.Name): description does not say when to use the skill"
        continue
    }

    $body = ($lines[($close + 1)..($lines.Count - 1)] -join "`n").Trim()
    if ($body.Length -lt 200) {
        $problems += "FAIL $($d.Name): body is too short to be a real skill"
        continue
    }

    Write-Output "OK   $($d.Name)"
}

if ($problems.Count -gt 0) {
    $problems | ForEach-Object { Write-Output $_ }
    exit 1
}
Write-Output "All skills valid."
exit 0
