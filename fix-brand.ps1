$files = Get-ChildItem -Recurse -Include '*.js','*.css','*.html' -Path 'src' -ErrorAction SilentlyContinue

$count = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  if ($null -eq $content) { continue }
  $new = $content `
    -replace 'support@affordplugins\.com', 'dr.zed19999@gmail.com' `
    -replace 'affordplugins\.com', 'affordplugins.vercel.app' `
    -replace 'affordpluginsplugins\.com', 'affordplugins.vercel.app'
  if ($new -ne $content) {
    Set-Content $file.FullName $new -Encoding UTF8 -NoNewline
    $count++
    Write-Host ('Fixed: ' + $file.Name)
  }
}
Write-Host ('Total fixed: ' + $count)
