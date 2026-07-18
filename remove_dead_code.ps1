$f = 'src\pages\AdminPanelPage.js'
$lines = Get-Content $f
$out = $lines[0..982] + $lines[1340..($lines.Count-1)]
$out | Set-Content $f -Encoding UTF8
Write-Host "Lines after: $($out.Count)"
