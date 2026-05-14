$tmp = 'tmp_pkg'
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path "$tmp\css", "$tmp\js", "$tmp\icons", "$tmp\_locales\zh_CN", "$tmp\_locales\en" -Force | Out-Null

Copy-Item css\style.css "$tmp\css\"
Copy-Item js\*.js "$tmp\js\"
Copy-Item icons\*.png "$tmp\icons\"
Copy-Item _locales\zh_CN\messages.json "$tmp\_locales\zh_CN\"
Copy-Item _locales\en\messages.json "$tmp\_locales\en\"
Copy-Item manifest.json, newtab.html, privacy-policy.html, README.md, LICENSE $tmp\

Compress-Archive -Path "$tmp\*" -DestinationPath UniTab-v1.2.0.zip -CompressionLevel Optimal -Force

Remove-Item $tmp -Recurse -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead('UniTab-v1.2.0.zip').Entries | Select-Object FullName
Write-Host "Done: UniTab-v1.2.0.zip"
