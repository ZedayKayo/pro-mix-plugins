# Now strip ensureModal+openModal+closeModal from AdminPanelPage.js and replace with imports
$lines = Get-Content 'src\pages\AdminPanelPage.js'
# Lines to remove (0-indexed): ensureModal 72..832, openModal 1581..1647
# Keep: 0..71, 833..1580, 1648..end
$kept = $lines[0..71] + $lines[833..1580] + $lines[1648..($lines.Count-1)]
$kept | Set-Content 'src\pages\AdminPanelPage.js' -Encoding UTF8
Write-Host "AdminPanelPage.js after strip: $($kept.Count) lines"
