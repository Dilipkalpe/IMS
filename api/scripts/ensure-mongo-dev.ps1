# Called before npm run dev — ensures MongoDB is listening on 27017.
$ErrorActionPreference = 'Stop'
$scriptDir = $PSScriptRoot
& (Join-Path $scriptDir 'start-mongo-dev.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
