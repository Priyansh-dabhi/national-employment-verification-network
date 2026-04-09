package main

import (
	"github.com/nevs/chaincode/nevs/contracts"
)

// GetContracts returns all contract instances to be registered with the chaincode.
func GetContracts() []interface{} {
	return []interface{}{
		&contracts.CompanyRegistryContract{},
		&contracts.EmployeeRegistryContract{},
		&contracts.EmploymentLifecycleContract{},
		&contracts.VerificationContract{},
		&contracts.AccessControlContract{},
	}
}
