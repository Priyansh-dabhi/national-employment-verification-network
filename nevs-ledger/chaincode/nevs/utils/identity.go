package utils

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Roles
const (
	RoleGovt     = "govt"
	RoleCompany  = "company"
	RoleEmployee = "employee"
	RoleVerifier = "verifier"
)

// GetCallerMSPID returns the MSP ID of the transaction caller.
func GetCallerMSPID(ctx contractapi.TransactionContextInterface) (string, error) {
	return ctx.GetClientIdentity().GetMSPID()
}

// GetCallerRole extracts the "role" attribute from the caller's certificate.
// Falls back to "govt" if role attribute is missing and caller is CentralGovtMSP.
func GetCallerRole(ctx contractapi.TransactionContextInterface) (string, error) {
	role, found, err := ctx.GetClientIdentity().GetAttributeValue("role")
	if err != nil {
		return "", fmt.Errorf("failed to get role attribute: %v", err)
	}
	if !found || role == "" {
		// Fallback: if the caller belongs to CentralGovtMSP, treat as govt
		mspID, _ := GetCallerMSPID(ctx)
		if mspID == "CentralGovtMSP" {
			return RoleGovt, nil
		}
		return "", fmt.Errorf("role attribute not found in certificate")
	}
	return role, nil
}

// GetCallerCompanyID extracts the "companyId" attribute from the caller's certificate.
func GetCallerCompanyID(ctx contractapi.TransactionContextInterface) (string, error) {
	companyID, found, err := ctx.GetClientIdentity().GetAttributeValue("companyId")
	if err != nil {
		return "", fmt.Errorf("failed to get companyId attribute: %v", err)
	}
	if !found || companyID == "" {
		return "", fmt.Errorf("companyId attribute not found in certificate")
	}
	return companyID, nil
}

// GetCallerEmployeeID extracts the "employeeID" attribute from the caller's certificate.
func GetCallerEmployeeID(ctx contractapi.TransactionContextInterface) (string, error) {
	employeeID, found, err := ctx.GetClientIdentity().GetAttributeValue("employeeID")
	if err != nil {
		return "", fmt.Errorf("failed to get employeeID attribute: %v", err)
	}
	if !found || employeeID == "" {
		return "", fmt.Errorf("employeeID attribute not found in certificate")
	}
	return employeeID, nil
}

// RequireRole verifies the caller has the expected role. Returns error if not.
func RequireRole(ctx contractapi.TransactionContextInterface, expectedRole string) error {
	role, err := GetCallerRole(ctx)
	if err != nil {
		return err
	}
	if role != expectedRole {
		return fmt.Errorf("access denied: required role '%s', caller has '%s'", expectedRole, role)
	}
	return nil
}
