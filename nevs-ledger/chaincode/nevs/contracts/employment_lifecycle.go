package contracts

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/models"
	"github.com/nevs/chaincode/nevs/utils"
)

// EmploymentLifecycleContract manages the full employment lifecycle
type EmploymentLifecycleContract struct {
	contractapi.Contract
}

func generateVerificationHash(employeeID, companyID, startDate string) string {
	data := employeeID + companyID + startDate
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// ProposeEmployment creates a new employment record (Requires company or govt role)
func (s *EmploymentLifecycleContract) ProposeEmployment(ctx contractapi.TransactionContextInterface, employmentID, employeeID, companyID, position, department, startDate, createdAt string) error {
	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		return err
	}

	if role != utils.RoleGovt && role != utils.RoleCompany {
		return fmt.Errorf("access denied: only govt or company can propose employment")
	}
	
	// If caller is a company, they can only propose for themselves
	if role == utils.RoleCompany {
		callerCompanyID, err := utils.GetCallerCompanyID(ctx)
		if err != nil {
			return err
		}
		if callerCompanyID != companyID {
			return fmt.Errorf("access denied: company %s cannot propose employment for company %s", callerCompanyID, companyID)
		}
	}

	// 1. Verify Company is APPROVED
	companyContract := new(CompanyRegistryContract)
	company, err := companyContract.GetCompany(ctx, companyID)
	if err != nil {
		return fmt.Errorf("failed to verify company: %v", err)
	}
	if company.Status != models.CompanyStatusApproved {
		return fmt.Errorf("company %s is not active/approved (status: %s)", companyID, company.Status)
	}

	// 2. Verify Employee is ACTIVE
	employeeContract := new(EmployeeRegistryContract)
	employee, err := employeeContract.GetEmployee(ctx, employeeID)
	if err != nil {
		return fmt.Errorf("failed to verify employee: %v", err)
	}
	if employee.Status != models.EmployeeStatusActive {
		return fmt.Errorf("employee %s is not active (status: %s)", employeeID, employee.Status)
	}

	// 3. Check if employment ID already exists
	exists, err := s.EmploymentExists(ctx, employeeID, employmentID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("employment %s for employee %s already exists", employmentID, employeeID)
	}

	proposedBy, _ := utils.GetCallerMSPID(ctx)
	if role == utils.RoleCompany {
		proposedBy, _ = utils.GetCallerCompanyID(ctx)
	}

	employment := models.Employment{
		EmploymentID:     employmentID,
		EmployeeID:       employeeID,
		CompanyID:        companyID,
		Position:         position,
		StartDate:        startDate,
		Status:           models.EmploymentStatusProposed,
		VerificationHash: generateVerificationHash(employeeID, companyID, startDate),
		ProposedBy:       proposedBy,
		CreatedAt:        createdAt,
		UpdatedAt:        createdAt,
	}

	if department != "" {
		employment.Department = department
	}

	employmentJSON, err := json.Marshal(employment)
	if err != nil {
		return err
	}

	// Create Primary Key: EMPLOYMENT~employeeId~employmentId
	primaryKey, err := ctx.GetStub().CreateCompositeKey(utils.EmploymentIndex, []string{employeeID, employmentID})
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(primaryKey, employmentJSON)
	if err != nil {
		return err
	}

	// Create Secondary Key: EMP_COMPANY~companyId~employmentId -> pointing to null payload
	// The payload is empty because we can re-construct primary key to fetch true state,
	// or we can store the employmentJSON again. For simplicity, we'll store employmentJSON.
	secKey, err := ctx.GetStub().CreateCompositeKey(utils.EmpByCompanyIndex, []string{companyID, employmentID})
	if err != nil {
		return err
	}
	
	err = ctx.GetStub().PutState(secKey, employmentJSON)
	if err != nil {
		return err
	}

	err = ctx.GetStub().SetEvent("EmploymentProposed", employmentJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// EmployeeConsent transitions PROPOSED to CONSENTED (Requires employee or govt role)
func (s *EmploymentLifecycleContract) EmployeeConsent(ctx contractapi.TransactionContextInterface, employeeID, employmentID, updatedAt string) error {
	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		return err
	}

	if role != utils.RoleGovt && role != utils.RoleEmployee {
		return fmt.Errorf("access denied: only govt or employee can consent to employment")
	}

	if role == utils.RoleEmployee {
		callerEmployeeID, err := utils.GetCallerEmployeeID(ctx)
		if err != nil {
			return err
		}
		if callerEmployeeID != employeeID {
			return fmt.Errorf("access denied: employee %s cannot consent for employee %s", callerEmployeeID, employeeID)
		}
	}

	employment, err := s.GetEmployment(ctx, employeeID, employmentID)
	if err != nil {
		return err
	}

	if employment.Status != models.EmploymentStatusProposed {
		return fmt.Errorf("employment must be PROPOSED to grant consent (current: %s)", employment.Status)
	}

	employment.Status = models.EmploymentStatusConsented
	employment.UpdatedAt = updatedAt
	employment.ConsentedAt = updatedAt

	err = s.saveEmploymentState(ctx, employment)
	if err != nil {
		return err
	}

	employmentJSON, _ := json.Marshal(employment)
	return ctx.GetStub().SetEvent("EmploymentConsented", employmentJSON)
}

// ConfirmEmployment transitions CONSENTED to CONFIRMED (Requires govt role)
func (s *EmploymentLifecycleContract) ConfirmEmployment(ctx contractapi.TransactionContextInterface, employeeID, employmentID, updatedAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	employment, err := s.GetEmployment(ctx, employeeID, employmentID)
	if err != nil {
		return err
	}

	if employment.Status != models.EmploymentStatusConsented {
		return fmt.Errorf("employment must be CONSENTED to be confirmed (current: %s)", employment.Status)
	}

	employment.Status = models.EmploymentStatusConfirmed
	employment.UpdatedAt = updatedAt
	employment.ConfirmedAt = updatedAt

	err = s.saveEmploymentState(ctx, employment)
	if err != nil {
		return err
	}

	employmentJSON, _ := json.Marshal(employment)
	return ctx.GetStub().SetEvent("EmploymentConfirmed", employmentJSON)
}

// TerminateEmployment transitions CONFIRMED to TERMINATED (Requires company or govt role)
func (s *EmploymentLifecycleContract) TerminateEmployment(ctx contractapi.TransactionContextInterface, employeeID, employmentID, endDate, updatedAt string) error {
	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		return err
	}

	if role != utils.RoleGovt && role != utils.RoleCompany {
		return fmt.Errorf("access denied: only govt or company can terminate employment")
	}

	employment, err := s.GetEmployment(ctx, employeeID, employmentID)
	if err != nil {
		return err
	}

	if role == utils.RoleCompany {
		callerCompanyID, err := utils.GetCallerCompanyID(ctx)
		if err != nil {
			return err
		}
		if callerCompanyID != employment.CompanyID {
			return fmt.Errorf("access denied: company %s cannot terminate employment for company %s", callerCompanyID, employment.CompanyID)
		}
	}

	if employment.Status != models.EmploymentStatusConfirmed {
		return fmt.Errorf("employment must be CONFIRMED to be terminated (current: %s)", employment.Status)
	}

	employment.Status = models.EmploymentStatusTerminated
	employment.EndDate = endDate
	employment.UpdatedAt = updatedAt
	employment.TerminatedAt = updatedAt

	err = s.saveEmploymentState(ctx, employment)
	if err != nil {
		return err
	}

	employmentJSON, _ := json.Marshal(employment)
	return ctx.GetStub().SetEvent("EmploymentTerminated", employmentJSON)
}

// GetEmployment retrieves employment by ID
func (s *EmploymentLifecycleContract) GetEmployment(ctx contractapi.TransactionContextInterface, employeeID, employmentID string) (models.Employment, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmploymentIndex, []string{employeeID, employmentID})
	if err != nil {
		return models.Employment{}, err
	}

	dataJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return models.Employment{}, fmt.Errorf("failed to read from world state: %v", err)
	}
	if dataJSON == nil {
		return models.Employment{}, fmt.Errorf("employment %s for employee %s does not exist", employmentID, employeeID)
	}

	var employment models.Employment
	err = json.Unmarshal(dataJSON, &employment)
	if err != nil {
		return models.Employment{}, err
	}

	return employment, nil
}

// GetEmploymentsByEmployee lists all employments for a specific employee
func (s *EmploymentLifecycleContract) GetEmploymentsByEmployee(ctx contractapi.TransactionContextInterface, employeeID string) ([]models.Employment, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(utils.EmploymentIndex, []string{employeeID})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var employments []models.Employment
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var employment models.Employment
		err = json.Unmarshal(queryResponse.Value, &employment)
		if err != nil {
			return nil, err
		}
		employments = append(employments, employment)
	}

	return employments, nil
}

// GetEmploymentsByCompany lists all employments for a specific company
func (s *EmploymentLifecycleContract) GetEmploymentsByCompany(ctx contractapi.TransactionContextInterface, companyID string) ([]models.Employment, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(utils.EmpByCompanyIndex, []string{companyID})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var employments []models.Employment
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var employment models.Employment
		err = json.Unmarshal(queryResponse.Value, &employment)
		if err != nil {
			return nil, err
		}
		employments = append(employments, employment)
	}

	return employments, nil
}

func (s *EmploymentLifecycleContract) EmploymentExists(ctx contractapi.TransactionContextInterface, employeeID, employmentID string) (bool, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmploymentIndex, []string{employeeID, employmentID})
	if err != nil {
		return false, err
	}

	dataJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return dataJSON != nil, nil
}

// saveEmploymentState is a helper to save both the primary and secondary indices
func (s *EmploymentLifecycleContract) saveEmploymentState(ctx contractapi.TransactionContextInterface, employment models.Employment) error {
	employmentJSON, err := json.Marshal(employment)
	if err != nil {
		return err
	}

	// Primary Key
	primaryKey, err := ctx.GetStub().CreateCompositeKey(utils.EmploymentIndex, []string{employment.EmployeeID, employment.EmploymentID})
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(primaryKey, employmentJSON)
	if err != nil {
		return err
	}

	// Secondary Key
	secKey, err := ctx.GetStub().CreateCompositeKey(utils.EmpByCompanyIndex, []string{employment.CompanyID, employment.EmploymentID})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(secKey, employmentJSON)
}
