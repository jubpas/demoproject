$lines = Get-Content 'task.md'
$output = @()
$output += $lines[0..43]
$output += $lines[97..($lines.Count - 1)]
$outPath = 'task.md'
$encoded = [System.Text.Encoding]::UTF8
[System.IO.File]::WriteAllText($outPath, ($output -join [Environment]::NewLine), $encoded)
Write-Host "Done. Original: $($lines.Count) lines. New: $($output.Count) lines."
