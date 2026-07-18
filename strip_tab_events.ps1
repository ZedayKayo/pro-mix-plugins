# Remove stale per-tab event handlers from attachEvents() 
# These are now handled by the module-level bindXxxTabEvents() functions
# Lines 585..829 (0-indexed: 584..828) contain the duplicate handlers for:
# - orders (btn-load-orders, btn-refresh-orders, admin-approve-order-btn)
# - users (btn-load-users, btn-refresh-users, admin-add-credits-btn)  
# - visitors (btn-load-visitors, btn-refresh-visitors, btn-refresh-notif-logs)
# - settings (discount slider, save discount, save site settings)
# - telegram (ts-save, ts-verify, ts-test)
# Keep: 0..583, 829..end
$lines = Get-Content 'src\pages\AdminPanelPage.js'
Write-Host "Before: $($lines.Count) lines"
$out = $lines[0..583] + $lines[829..($lines.Count-1)]
$out | Set-Content 'src\pages\AdminPanelPage.js' -Encoding UTF8
Write-Host "After: $($out.Count) lines"
