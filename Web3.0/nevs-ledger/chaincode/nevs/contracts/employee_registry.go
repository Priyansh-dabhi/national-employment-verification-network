package contracts

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/models"
	"github.com/nevs/chaincode/nevs/utils"
)

// EmployeeRegistryContract manages individual employee identities on the ledger
type EmployeeRegistryContract struct {
	contractapi.Contract
}

// RegisterEmployee creates a new employee record (Requires govt or company role)
func (s *EmployeeRegistryContract) RegisterEmployee(ctx contractapi.TransactionContextInterface, employeeID string, fullName string, dateOfBirth string, idHash string, createdAt string) error {
	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		return err
	}

	if role != utils.RoleGovt && role != utils.RoleCompany {
		return fmt.Errorf("access denied: only govt or company can register an employee")
	}

	exists, err := s.EmployeeExists(ctx, employeeID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("employee %s already exists", employeeID)
	}

	registeredBy := "GOVT"
	if role == utils.RoleCompany {
		companyID, err := utils.GetCallerCompanyID(ctx)
		if err != nil {
			return err
		}
		registeredBy = companyID
	}

	employee := models.Employee{
		EmployeeID:   employeeID,
		FullName:     fullName,
		DateOfBirth:  dateOfBirth,
		IDHash:       idHash,
		Status:       models.EmployeeStatusActive,
		RegisteredBy: registeredBy,
		CreatedAt:    createdAt,
		UpdatedAt:    createdAt,
	}

	employeeJSON, err := json.Marshal(employee)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmployeeIndex, []string{employeeID})
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(indexKey, employeeJSON)
	if err != nil {
		return err
	}

	err = ctx.GetStub().SetEvent("EmployeeRegistered", employeeJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// GetEmployee retrieves an employee by its ID (No specific role required for reads)
func (s *EmployeeRegistryContract) GetEmployee(ctx contractapi.TransactionContextInterface, employeeID string) (models.Employee, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmployeeIndex, []string{employeeID})
	if err != nil {
		return models.Employee{}, err
	}

	employeeJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return models.Employee{}, fmt.Errorf("failed to read from world state: %v", err)
	}
	if employeeJSON == nil {
		return models.Employee{}, fmt.Errorf("the employee %s does not exist", employeeID)
	}

	var employee models.Employee
	err = json.Unmarshal(employeeJSON, &employee)
	if err != nil {
		return models.Employee{}, err
	}

	return employee, nil
}

// UpdateEmployee updates an existing employee's details (Requires govt role)
func (s *EmployeeRegistryContract) UpdateEmployee(ctx contractapi.TransactionContextInterface, employeeID string, fullName string, status string, updatedAt string) error {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return err
	}

	employee, err := s.GetEmployee(ctx, employeeID)
	if err != nil {
		return err
	}

	if fullName != "" {
		employee.FullName = fullName
	}
	if status != "" {
		employee.Status = status
	}
	employee.UpdatedAt = updatedAt

	employeeJSON, err := json.Marshal(employee)
	if err != nil {
		return err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmployeeIndex, []string{employeeID})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, employeeJSON)
}

// GetAllEmployees returns all registered employees (Requires govt role)
func (s *EmployeeRegistryContract) GetAllEmployees(ctx contractapi.TransactionContextInterface) ([]models.Employee, error) {
	err := utils.RequireRole(ctx, utils.RoleGovt)
	if err != nil {
		return nil, err
	}

	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(utils.EmployeeIndex, []string{})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var employees []models.Employee
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var employee models.Employee
		err = json.Unmarshal(queryResponse.Value, &employee)
		if err != nil {
			return nil, err
		}
		employees = append(employees, employee)
	}

	return employees, nil
}

// EmployeeExists checks if an employee is already registered
func (s *EmployeeRegistryContract) EmployeeExists(ctx contractapi.TransactionContextInterface, employeeID string) (bool, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.EmployeeIndex, []string{employeeID})
	if err != nil {
		return false, err
	}

	employeeJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return employeeJSON != nil, nil
}
