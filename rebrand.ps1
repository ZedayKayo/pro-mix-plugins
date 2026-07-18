$files = Get-ChildItem -Recurse -Include '*.js','*.css','*.html' -Path 'src' -ErrorAction SilentlyContinue
$root = Get-Item 'index.html' -ErrorAction SilentlyContinue
if ($root) { $files += $root }

$count = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  if ($null -eq $content) { continue }
  $new = $content `
    -replace 'Pro-Mix Plugins', 'Afford Plugins' `
    -replace 'Pro Mix Plugins', 'Afford Plugins' `
    -replace 'ProMix Plugins', 'Afford Plugins' `
    -replace 'pro-mix-plugins', 'afford-plugins' `
    -replace 'pro_mix_plugins', 'afford_plugins' `
    -replace 'ProMix', 'Afford Plugins' `
    -replace 'pro-mix', 'afford-plugins' `
    -replace 'promix', 'affordplugins'
  if ($new -ne $content) {
    Set-Content $file.FullName $new -Encoding UTF8 -NoNewline
    $count++
    Write-Host ('Updated: ' + $file.Name)
  }
}
Write-Host ('Total files updated: ' + $count)
