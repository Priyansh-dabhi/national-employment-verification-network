package contracts

import (
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/utils"
)

// AccessControlContract provides introspection for caller identities
type AccessControlContract struct {
	contractapi.Contract
}

type CallerIdentity struct {
	MSPID     string `json:"mspId"`
	Role      string `json:"role"`
	CompanyID string `json:"companyId,omitempty"`
}

// GetCallerIdentity returns the MSP ID, role, and company ID of the caller
func (s *AccessControlContract) GetCallerIdentity(ctx contractapi.TransactionContextInterface) (CallerIdentity, error) {
	mspID, err := utils.GetCallerMSPID(ctx)
	if err != nil {
		return CallerIdentity{}, err
	}

	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		role = "UNKNOWN"
	}

	companyID, err := utils.GetCallerCompanyID(ctx)
	if err != nil {
		companyID = "" // Explicitly empty if not found
	}

	identity := CallerIdentity{
		MSPID:     mspID,
		Role:      role,
		CompanyID: companyID,
	}

	return identity, nil
}

// ValidateAccess returns whether the caller has a specific role (Useful for God Mode UI)
func (s *AccessControlContract) ValidateAccess(ctx contractapi.TransactionContextInterface, expectedRole string) (bool, error) {
	err := utils.RequireRole(ctx, expectedRole)
	if err != nil {
		return false, nil // Return false instead of blocking with error
	}
	return true, nil
}
