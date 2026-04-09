package contracts

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/models"
	"github.com/nevs/chaincode/nevs/utils"
)

// CompanyRegistryContract manages companies on the ledger
type CompanyRegistryContract struct {
	contractapi.Contract
}

// RegisterCompany creates a new company record with PENDING status (Requires govt role)
func (s *CompanyRegistryContract) RegisterCompany(ctx contractapi.TransactionContextInterface, companyID string, name string, registrationNo string, industry string, tier string, adminEmail string, createdAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	exists, err := s.CompanyExists(ctx, companyID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("company %s already exists", companyID)
	}

	company := models.Company{
		CompanyID:      companyID,
		Name:           name,
		RegistrationNo: registrationNo,
		Industry:       industry,
		Tier:           tier,
		Status:         models.CompanyStatusPending,
		AdminEmail:     adminEmail,
		CreatedAt:      createdAt,
		UpdatedAt:      createdAt,
		ApprovedBy:     "",
	}

	companyJSON, err := json.Marshal(company)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, companyJSON)
}

// ApproveCompany changes a company's status to APPROVED (Requires govt role)
func (s *CompanyRegistryContract) ApproveCompany(ctx contractapi.TransactionContextInterface, companyID string, updatedAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	company, err := s.GetCompany(ctx, companyID)
	if err != nil {
		return err
	}

	// Capture who approved it
	mspID, _ := utils.GetCallerMSPID(ctx)

	company.Status = models.CompanyStatusApproved
	company.UpdatedAt = updatedAt
	company.ApprovedBy = mspID

	companyJSON, err := json.Marshal(company)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, companyJSON)
}

// SuspendCompany changes a company's status to SUSPENDED (Requires govt role)
func (s *CompanyRegistryContract) SuspendCompany(ctx contractapi.TransactionContextInterface, companyID string, reason string, updatedAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	company, err := s.GetCompany(ctx, companyID)
	if err != nil {
		return err
	}

	company.Status = models.CompanyStatusSuspended
	company.UpdatedAt = updatedAt
	company.SuspendReason = reason
	company.SuspendedAt = updatedAt

	companyJSON, err := json.Marshal(company)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, companyJSON)
}

// RejectCompany changes a company's status to REJECTED (Requires govt role)
func (s *CompanyRegistryContract) RejectCompany(ctx contractapi.TransactionContextInterface, companyID string, updatedAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	company, err := s.GetCompany(ctx, companyID)
	if err != nil {
		return err
	}

	if company.Status != models.CompanyStatusPending {
		return fmt.Errorf("company must be PENDING to be rejected")
	}

	company.Status = models.CompanyStatusRejected
	company.UpdatedAt = updatedAt

	companyJSON, err := json.Marshal(company)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, companyJSON)
}

// GetCompany retrieves a company by its ID (No specific role required for reads, but handled at gateway)
func (s *CompanyRegistryContract) GetCompany(ctx contractapi.TransactionContextInterface, companyID string) (models.Company, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return models.Company{}, err
	}

	companyJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return models.Company{}, fmt.Errorf("failed to read from world state: %v", err)
	}
	if companyJSON == nil {
		return models.Company{}, fmt.Errorf("the company %s does not exist", companyID)
	}

	var company models.Company
	err = json.Unmarshal(companyJSON, &company)
	if err != nil {
		return models.Company{}, err
	}

	return company, nil
}

// GetAllCompanies returns all registered companies (Requires govt role)
func (s *CompanyRegistryContract) GetAllCompanies(ctx contractapi.TransactionContextInterface) ([]models.Company, error) {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return nil, err
	}

	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(utils.CompanyIndex, []string{})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var companies []models.Company
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var company models.Company
		err = json.Unmarshal(queryResponse.Value, &company)
		if err != nil {
			return nil, err
		}
		companies = append(companies, company)
	}

	return companies, nil
}

// GetCompaniesByStatus returns all companies with a specific status (Requires govt role)
func (s *CompanyRegistryContract) GetCompaniesByStatus(ctx contractapi.TransactionContextInterface, status string) ([]models.Company, error) {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return nil, err
	}

	// We must get all and filter because we didn't index by status for simplicity
	allCompanies, err := s.GetAllCompanies(ctx)
	if err != nil {
		return nil, err
	}

	var filtered []models.Company
	for _, company := range allCompanies {
		if company.Status == status {
			filtered = append(filtered, company)
		}
	}

	return filtered, nil
}

// CompanyExists checks if a company is already registered
func (s *CompanyRegistryContract) CompanyExists(ctx contractapi.TransactionContextInterface, companyID string) (bool, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.CompanyIndex, []string{companyID})
	if err != nil {
		return false, err
	}

	companyJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return companyJSON != nil, nil
}
