package main

import (
	"log"
	"os"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	employmentSmartContract := new(SmartContract)

	chaincode, err := contractapi.NewChaincode(employmentSmartContract)
	if err != nil {
		log.Panicf("Error creating employment smart contract: %v", err)
	}

	// For CCaaS, we must start a server instead of standard Start()
	server := &shim.ChaincodeServer{
		CCID:    os.Getenv("CHAINCODE_ID"), // passed in from docker-compose.chaincode.yaml
		Address: os.Getenv("CHAINCODE_SERVER_ADDRESS"),
		CC:      chaincode,
		TLSProps: shim.TLSProperties{
			Disabled: true, // TLS is false in our compose file for simplicity
		},
	}

	log.Printf("Starting chaincode server on %s", server.Address)
	if err := server.Start(); err != nil {
		log.Panicf("Error starting employment smart contract server: %v", err)
	}
}
