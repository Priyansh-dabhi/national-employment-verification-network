package main

import (
	"log"
	"os"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/contracts"
)

func main() {
	chaincode, err := contractapi.NewChaincode(
		&contracts.CompanyRegistryContract{},
		&contracts.EmployeeRegistryContract{},
		&contracts.EmploymentLifecycleContract{},
		&contracts.VerificationContract{},
		&contracts.AccessControlContract{},
	)
	if err != nil {
		log.Panicf("Error creating NEVS chaincode: %v", err)
	}

	server := &shim.ChaincodeServer{
		CCID:    os.Getenv("CHAINCODE_ID"),
		Address: os.Getenv("CHAINCODE_SERVER_ADDRESS"),
		CC:      chaincode,
		TLSProps: shim.TLSProperties{
			Disabled: true,
		},
	}

	log.Printf("Starting NEVS chaincode server on %s", server.Address)
	if err := server.Start(); err != nil {
		log.Panicf("Error starting NEVS chaincode server: %v", err)
	}
}
