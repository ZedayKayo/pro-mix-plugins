# Extract ensureModal (lines 73-834) and openModal/closeModal (1582-1648) into ProductModal.js
$src = Get-Content 'src\pages\AdminPanelPage.js' -Raw

# Write a line-indexed version
$lines = $src -split "`n"
Write-Host "Total lines: $($lines.Count)"

# ensureModal: lines 73..833 (0-indexed: 72..832)
# openModal: lines 1582..1648 (0-indexed: 1581..1647)
$modalLines = $lines[72..832]
$openCloseLines = $lines[1581..1647]

$header = @"
// ═══════════════════════════════════════════════════
// Admin Panel — Product Add/Edit Modal
// ═══════════════════════════════════════════════════
import { getBrandList, categories } from '../../data/products.js';
import { autoFillPluginData } from '../../services/aiService.js';
import { saveProduct } from '../../core/store.js';
import { showToast } from '../../components/Toast.js';
import { supabase } from '../../lib/supabase.js';

/**
 * ensureModal(state, closeModal)
 * Creates and appends the product add/edit modal to document.body.
 * Returns the modal element.
 */
export $($modalLines -join "`n")

export $($openCloseLines -join "`n")
"@

$header | Set-Content 'src\pages\admin\ProductModal.js' -Encoding UTF8
Write-Host "ProductModal.js written: $((Get-Content 'src\pages\admin\ProductModal.js').Count) lines"
