# enroll_peer1.ps1
$ProjectRoot = "C:\Users\narendra\Desktop\documents\web Development Programming\AA.College-final-year-project\nevs-ledger"
$OrgDir = "$ProjectRoot\network\organizations\peerOrganizations\central.govt"
$env:FABRIC_CA_CLIENT_HOME = $OrgDir

Write-Host "Registering peer1.central.govt..."
fabric-ca-client register --caname ca-central-govt --id.name peer1.central.govt --id.secret peer1pw --id.type peer --tls.certfiles "$OrgDir\ca\ca-cert.pem"

Write-Host "Enrolling peer1.central.govt..."
fabric-ca-client enroll -u https://peer1.central.govt:peer1pw@localhost:7054 --caname ca-central-govt -M "$OrgDir\peers\peer1.central.govt\msp" --csr.hosts peer1.central.govt --tls.certfiles "$OrgDir\ca\ca-cert.pem"

Copy-Item "$OrgDir\msp\config.yaml" "$OrgDir\peers\peer1.central.govt\msp\config.yaml"

Write-Host "Enrolling TLS for peer1.central.govt..."
fabric-ca-client enroll -u https://peer1.central.govt:peer1pw@localhost:7054 --caname ca-central-govt -M "$OrgDir\peers\peer1.central.govt\tls" --enrollment.profile tls --csr.hosts peer1.central.govt --csr.hosts localhost --tls.certfiles "$OrgDir\ca\ca-cert.pem"

Set-Location "$OrgDir\peers\peer1.central.govt\tls"
Copy-Item "keystore\*" "server.key"
Copy-Item "signcerts\*" "server.crt"
Copy-Item "tlscacerts\*" "ca.crt"

Write-Host "Peer 1 identities bootstrapped successfully."
