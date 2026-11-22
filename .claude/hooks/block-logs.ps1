# PreToolUse hook (G1-a): blocks Write/Edit on any path under <project>/logs/.
# logs/ holds original, unedited session evidence. Copies are added with a
# shell copy at session close, never through Write/Edit.
# Exit 2 blocks the tool call; stderr is returned to Claude as the reason.

$ErrorActionPreference = 'Stop'

try {
    $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
    [Console]::Error.WriteLine("block-logs hook: could not parse hook input: $($_.Exception.Message)")
    exit 2
}

$filePath = [string]$payload.tool_input.file_path
if ([string]::IsNullOrWhiteSpace($filePath)) { exit 0 }

$root = $env:CLAUDE_PROJECT_DIR
if ([string]::IsNullOrWhiteSpace($root)) { $root = [string]$payload.cwd }

$normalizedPath = ($filePath -replace '\\', '/')
$normalizedRoot = ($root -replace '\\', '/').TrimEnd('/')
$logsPrefix = "$normalizedRoot/logs/"

if ($normalizedPath.StartsWith($logsPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    [Console]::Error.WriteLine("Blocked by G1-a: logs/ contains original evidence and must not be written or edited ($filePath).")
    exit 2
}

exit 0
