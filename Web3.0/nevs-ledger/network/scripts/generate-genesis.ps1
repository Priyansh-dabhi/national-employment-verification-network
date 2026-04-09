$ConfigTxPath = "$PSScriptRoot\..\configtx"
$SystemGenesisPath = "$PSScriptRoot\..\system-genesis-block"
$ConfigTxYaml = "$ConfigTxPath\configtx.yaml"
$OrdererMspDir = "$PSScriptRoot\..\organizations\ordererOrganizations\nevs.gov\msp"
$FabricBin = "C:\Users\narendra\Desktop\documents\web Development Programming\AA.College-final-year-project\fabric-samples\bin"
Write-Host "FabricBin: $FabricBin"


# Add Fabric binaries to PATH for this session
if ($env:PATH -notlike "*$FabricBin*") {
    $env:PATH = "$FabricBin;$env:PATH"
    Write-Host "Added Fabric binaries to PATH: $FabricBin"
}



Write-Host "Checking configtx.yaml..."
if (-not (Test-Path $ConfigTxYaml)) {
    Write-Error "configtx.yaml NOT FOUND"
    exit 1
}

Write-Host "Checking Orderer MSP..."
if (-not (Test-Path $OrdererMspDir)) {
    Write-Error "Orderer MSP NOT FOUND"
    exit 1
}

if (-not (Test-Path $SystemGenesisPath)) {
    New-Item -ItemType Directory -Force -Path $SystemGenesisPath | Out-Null
}

Write-Host "Generating System Genesis Block..."
Set-Location $ConfigTxPath
$env:FABRIC_CFG_PATH = $ConfigTxPath

# Run configtxgen
$ConfigTxGen = "$FabricBin\configtxgen.exe"
# Use invocation operator & and quotes for handling spaces in path
& "$ConfigTxGen" -profile NEVSOrdererGenesis -channelID system-channel -outputBlock "$SystemGenesisPath\genesis.block"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Genesis block generated"
    & "$ConfigTxGen" -inspectBlock "$SystemGenesisPath\genesis.block"
} else {


    Write-Error "FAILED to generate genesis block"
    exit 1
}
