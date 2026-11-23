<#
.SYNOPSIS
  Exports a Claude Code session transcript into logs/sessions/ as a new snapshot folder (G1-e, G1-f).

.DESCRIPTION
  - Copies the main JSONL and the session folder (subagents, tool results, metadata).
  - The only transformation allowed is replacing the literal strings listed in a redaction file
    that lives OUTSIDE the repository (one string per line, '#' for comments). Default:
    %USERPROFILE%\.claude\redactions.txt. The strings themselves never appear in the repo.
  - Files without matches are copied byte-for-byte.
  - Never overwrites: each run creates a new folder logs/sessions/<timestamp>-<session8>/.
  - Appends a section to docs/logs-manifest.md with SHA-256 of every original and copied file
    and the number of replacements per file.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/export-session-logs.ps1 -SessionId <uuid>
#>
param(
    [Parameter(Mandatory = $true)] [string] $SessionId,
    [string] $RedactionFile = (Join-Path $env:USERPROFILE '.claude\redactions.txt'),
    [string] $ProjectRoot,
    [string] $TranscriptDir
)

$ErrorActionPreference = 'Stop'
# $PSScriptRoot is empty inside param() defaults on Windows PowerShell 5.1, so resolve it here.
if (-not $ProjectRoot) { $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
$token = '<redacted-personal-data>'
$textExtensions = @('.jsonl', '.json', '.txt', '.md')
$utf8 = New-Object System.Text.UTF8Encoding($false, $true)   # no BOM, throw on invalid bytes

if (-not $TranscriptDir) {
    $slug = $ProjectRoot -replace '[:\\/ _]', '-'
    $TranscriptDir = Join-Path $env:USERPROFILE ".claude\projects\$slug"
}

$mainFile = Join-Path $TranscriptDir "$SessionId.jsonl"
$sessionFolder = Join-Path $TranscriptDir $SessionId
if (-not (Test-Path $mainFile)) { throw "Transcript not found: $mainFile" }
if (-not (Test-Path $RedactionFile)) { throw "Redaction file not found: $RedactionFile" }

$redactions = Get-Content -LiteralPath $RedactionFile -Encoding UTF8 |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -and -not $_.StartsWith('#') }
if (-not $redactions) { throw "Redaction file has no entries: $RedactionFile" }

$stamp = Get-Date -Format 'yyyy-MM-ddTHHmm'
$destRoot = Join-Path $ProjectRoot ("logs\sessions\{0}-{1}" -f $stamp, $SessionId.Substring(0, 8))
if (Test-Path $destRoot) { throw "Destination already exists, refusing to overwrite: $destRoot" }

function Get-Sha256([byte[]] $bytes) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

$sources = @(Get-Item -LiteralPath $mainFile)
if (Test-Path $sessionFolder) {
    $sources += Get-ChildItem -LiteralPath $sessionFolder -Recurse -File
}

$rows = @()
foreach ($src in $sources) {
    $rel = $src.FullName.Substring($TranscriptDir.Length).TrimStart('\')
    $dest = Join-Path $destRoot $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null

    $bytes = [System.IO.File]::ReadAllBytes($src.FullName)   # single snapshot read
    $srcHash = Get-Sha256 $bytes
    $outBytes = $bytes
    $count = 0

    if ($textExtensions -contains $src.Extension.ToLowerInvariant()) {
        $text = $utf8.GetString($bytes)
        if (-not [System.Linq.Enumerable]::SequenceEqual([byte[]]$utf8.GetBytes($text), [byte[]]$bytes)) {
            throw "UTF-8 round-trip is not lossless for $rel; aborting to avoid altering bytes."
        }
        foreach ($r in $redactions) {
            $pattern = [regex]::Escape($r)
            $count += [regex]::Matches($text, $pattern, 'IgnoreCase').Count
            $text = [regex]::Replace($text, $pattern, $token, 'IgnoreCase')
        }
        if ($count -gt 0) { $outBytes = $utf8.GetBytes($text) }
    }

    [System.IO.File]::WriteAllBytes($dest, $outBytes)
    $rows += [pscustomobject]@{ File = $rel; Replacements = $count; SourceSha256 = $srcHash; CopySha256 = (Get-Sha256 $outBytes) }
}

# Verify no redacted string remains in the snapshot.
$leaks = 0
foreach ($file in Get-ChildItem -LiteralPath $destRoot -Recurse -File) {
    if ($textExtensions -contains $file.Extension.ToLowerInvariant()) {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        foreach ($r in $redactions) { $leaks += [regex]::Matches($content, [regex]::Escape($r), 'IgnoreCase').Count }
    }
}
if ($leaks -gt 0) { throw "Verification failed: $leaks redacted string(s) still present in $destRoot" }

# Manifest (outside logs/).
$manifest = Join-Path $ProjectRoot 'docs\logs-manifest.md'
if (-not (Test-Path $manifest)) {
    $header = @(
        '# Session logs manifest',
        '',
        'Each export by `scripts/export-session-logs.ps1` adds a section. The only transformation allowed (decision G1-f): replace with `<redacted-personal-data>` the strings of a redaction file that lives outside the repository. Files with 0 substitutions are byte-for-byte copies (source hash = copy hash). The originals remain in `~/.claude/projects/` on the author''s machine.',
        ''
    ) -join "`n"
    [System.IO.File]::WriteAllText($manifest, $header + "`n", (New-Object System.Text.UTF8Encoding($false)))
}
$relDest = $destRoot.Substring($ProjectRoot.Length).TrimStart('\') -replace '\\', '/'
$lines = @(
    "## $relDest",
    '',
    ('- Session: `{0}` · exported: {1} · redacted strings: {2} · files: {3} · total substitutions: {4}' -f $SessionId, (Get-Date -Format 'yyyy-MM-dd HH:mm'), @($redactions).Count, $rows.Count, ($rows | Measure-Object Replacements -Sum).Sum),
    '- Verification: 0 redacted strings present in the copy.',
    '',
    '| File | Substitutions | Original SHA-256 | Copy SHA-256 |',
    '|---|---|---|---|'
)
foreach ($row in $rows) {
    $lines += ('| `{0}` | {1} | `{2}` | `{3}` |' -f ($row.File -replace '\\', '/'), $row.Replacements, $row.SourceSha256, $row.CopySha256)
}
$lines += ''
[System.IO.File]::AppendAllText($manifest, ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))

$rows | Format-Table File, Replacements -AutoSize | Out-String -Width 200
"Snapshot: $relDest"
"Manifest: docs/logs-manifest.md"
