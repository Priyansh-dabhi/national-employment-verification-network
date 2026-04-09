package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an EmploymentRecord
type SmartContract struct {
	contractapi.Contract
}

// CreateEmploymentRecord issues a new employment record.
func (s *SmartContract) CreateEmploymentRecord(ctx contractapi.TransactionContextInterface, recordID string, employeeID string, employerID string, position string, startDate string, status string, createdAt string, updatedAt string) error {
	// Form composite key: EMPLOYMENT~employeeId~recordId
	indexKey, err := ctx.GetStub().CreateCompositeKey(EmploymentIndexName, []string{employeeID, recordID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	exists, err := s.EmploymentRecordExists(ctx, employeeID, recordID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the employment record %s for employee %s already exists", recordID, employeeID)
	}

	record := EmploymentRecord{
		RecordID:   recordID,
		EmployeeID: employeeID,
		EmployerID: employerID,
		Position:   position,
		StartDate:  startDate,
		EndDate:    "",
		Status:     status,
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
	
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, recordJSON)
}

// GetEmploymentRecord returns the employment record stored in the world state with given id.
func (s *SmartContract) GetEmploymentRecord(ctx contractapi.TransactionContextInterface, employeeID string, recordID string) (*EmploymentRecord, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(EmploymentIndexName, []string{employeeID, recordID})
	if err != nil {
		return nil, fmt.Errorf("failed to create composite key: %v", err)
	}

	recordJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("the employment record %s for employee %s does not exist", recordID, employeeID)
	}

	var record EmploymentRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// UpdateEmploymentStatus updates an existing employment record's status and end date deterministically.
func (s *SmartContract) UpdateEmploymentStatus(ctx contractapi.TransactionContextInterface, employeeID string, recordID string, newStatus string, endDate string, updatedAt string) error {
	indexKey, err := ctx.GetStub().CreateCompositeKey(EmploymentIndexName, []string{employeeID, recordID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	recordJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return fmt.Errorf("the employment record %s for employee %s does not exist", recordID, employeeID)
	}

	var record EmploymentRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return err
	}

	record.Status = newStatus
	if endDate != "" {
		record.EndDate = endDate
	}
	record.UpdatedAt = updatedAt

	updatedRecordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(indexKey, updatedRecordJSON)
}

// GetEmploymentHistory returns all employment records for a specific employee.
func (s *SmartContract) GetEmploymentHistory(ctx contractapi.TransactionContextInterface, employeeID string) ([]*EmploymentRecord, error) {
	// Query the composite keys matching EMPLOYMENT~employeeId
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(EmploymentIndexName, []string{employeeID})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*EmploymentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record EmploymentRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

// GetAllEmploymentRecords returns all employment records across the network.
func (s *SmartContract) GetAllEmploymentRecords(ctx contractapi.TransactionContextInterface) ([]*EmploymentRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(EmploymentIndexName, []string{})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*EmploymentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record EmploymentRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}

// EmploymentRecordExists returns true when record with given ID exists in world state
func (s *SmartContract) EmploymentRecordExists(ctx contractapi.TransactionContextInterface, employeeID string, recordID string) (bool, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(EmploymentIndexName, []string{employeeID, recordID})
	if err != nil {
		return false, fmt.Errorf("failed to create composite key: %v", err)
	}

	recordJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return recordJSON != nil, nil
}

// SetPrivateEmploymentData sets the salary and compensation of an employee in a Private Data Collection
func (s *SmartContract) SetPrivateEmploymentData(ctx contractapi.TransactionContextInterface) error {
	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient map: %v", err)
	}

	transientData, ok := transientMap["employmentPrivateData"]
	if !ok {
		return fmt.Errorf("employmentPrivateData not found in the transient map")
	}

	var data EmploymentPrivateData
	err = json.Unmarshal(transientData, &data)
	if err != nil {
		return fmt.Errorf("failed to decode JSON transient data: %v", err)
	}

	if data.RecordID == "" {
		return fmt.Errorf("recordId field must be a non-empty string")
	}

	return ctx.GetStub().PutPrivateData(PrivateDataIndexName, data.RecordID, transientData)
}

// GetPrivateEmploymentData returns the private data from the PDC
func (s *SmartContract) GetPrivateEmploymentData(ctx contractapi.TransactionContextInterface, recordID string) (*EmploymentPrivateData, error) {
	privateData, err := ctx.GetStub().GetPrivateData(PrivateDataIndexName, recordID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from private data collection: %v", err)
	}
	if privateData == nil {
		return nil, fmt.Errorf("private data for record %s does not exist", recordID)
	}

	var data EmploymentPrivateData
	err = json.Unmarshal(privateData, &data)
	if err != nil {
		return nil, fmt.Errorf("failed to decode JSON private data: %v", err)
	}

	return &data, nil
}
