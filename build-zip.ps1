param(
  [ValidateSet('generic', 'chrome')]
  [string]$Target = 'generic'
)

node pack-zip.js $Target
