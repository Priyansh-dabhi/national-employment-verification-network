package contracts

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/nevs/chaincode/nevs/models"
	"github.com/nevs/chaincode/nevs/utils"
)

// VerificationContract allows external entities to verify employment records
type VerificationContract struct {
	contractapi.Contract
}

type VerificationProof struct {
	VerificationHash string `json:"verificationHash"`
	CompanyID        string `json:"companyId"`
	Status           string `json:"status"`
	Timestamp        string `json:"timestamp"`
}

// VerifyEmployment checks an employment record and creates a verification trail
func (s *VerificationContract) VerifyEmployment(ctx contractapi.TransactionContextInterface, verificationID, employmentID, employeeID, requestedAt string) (models.VerificationRecord, error) {
	// For phase 2, verifiers might use the gateway (so fallback to govt role) or have their own identity.
	role, err := utils.GetCallerRole(ctx)
	if err != nil {
		return models.VerificationRecord{}, err
	}
	
	if role != utils.RoleGovt && role != utils.RoleVerifier {
		return models.VerificationRecord{}, fmt.Errorf("access denied: only verifiers or govt can initiate verification")
	}

	verifierID := "GOVT"
	if role == utils.RoleVerifier {
		// Example: extract verifier organization name or ID from certificate
		// Assuming we use org MSP ID for now
		mspID, err := utils.GetCallerMSPID(ctx)
		if err == nil {
			verifierID = mspID
		}
	}

	// Fetch the employment record
	employmentContract := new(EmploymentLifecycleContract)
	employment, err := employmentContract.GetEmployment(ctx, employeeID, employmentID)
	
	record := models.VerificationRecord{
		VerificationID: verificationID,
		EmploymentID:   employmentID,
		EmployeeID:     employeeID,
		VerifierID:     verifierID,
		RequestedAt:    requestedAt,
		RespondedAt:    requestedAt,
	}

	if err != nil {
		record.Status = "NOT_FOUND"
	} else if employment.Status != models.EmploymentStatusConfirmed && employment.Status != models.EmploymentStatusTerminated {
		// Only confirmed or terminated employment can be verified
		record.Status = "NOT_CONFIRMED"
		record.CompanyID = employment.CompanyID
	} else {
		record.Status = "VERIFIED"
		record.CompanyID = employment.CompanyID
		record.VerificationHash = employment.VerificationHash
	}

	// Save verification record
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return models.VerificationRecord{}, err
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.VerificationIndex, []string{verificationID})
	if err != nil {
		return models.VerificationRecord{}, err
	}
	err = ctx.GetStub().PutState(indexKey, recordJSON)
	if err != nil {
		return models.VerificationRecord{}, err
	}

	// Secondary index to lookup verifications by employment
	secKey, err := ctx.GetStub().CreateCompositeKey(utils.VerifByEmployment, []string{employmentID, verificationID})
	if err != nil {
		return models.VerificationRecord{}, err
	}
	err = ctx.GetStub().PutState(secKey, recordJSON)
	if err != nil {
		return models.VerificationRecord{}, err
	}

	return record, nil
}

// GetVerificationRecord retrieves a specific verification attempt
func (s *VerificationContract) GetVerificationRecord(ctx contractapi.TransactionContextInterface, verificationID string) (models.VerificationRecord, error) {
	indexKey, err := ctx.GetStub().CreateCompositeKey(utils.VerificationIndex, []string{verificationID})
	if err != nil {
		return models.VerificationRecord{}, err
	}

	dataJSON, err := ctx.GetStub().GetState(indexKey)
	if err != nil {
		return models.VerificationRecord{}, fmt.Errorf("failed to read from world state: %v", err)
	}
	if dataJSON == nil {
		return models.VerificationRecord{}, fmt.Errorf("verification record %s does not exist", verificationID)
	}

	var record models.VerificationRecord
	err = json.Unmarshal(dataJSON, &record)
	if err != nil {
		return models.VerificationRecord{}, err
	}

	return record, nil
}

// GetEmploymentHistory returns the employment history for an employee (Public read for verifiers)
func (s *VerificationContract) GetEmploymentHistory(ctx contractapi.TransactionContextInterface, employeeID string) ([]models.Employment, error) {
	employmentContract := new(EmploymentLifecycleContract)
	return employmentContract.GetEmploymentsByEmployee(ctx, employeeID)
}

// GenerateVerificationProof generates a proof hash for an employment claim without revealing all data
func (s *VerificationContract) GenerateVerificationProof(ctx contractapi.TransactionContextInterface, employeeID, employmentID, timestamp string) (*VerificationProof, error) {
	employmentContract := new(EmploymentLifecycleContract)
	employment, err := employmentContract.GetEmployment(ctx, employeeID, employmentID)
	if err != nil {
		return nil, err
	}
	
	if employment.Status != models.EmploymentStatusConfirmed && employment.Status != models.EmploymentStatusTerminated {
		return nil, fmt.Errorf("cannot generate proof for employment in status: %s", employment.Status)
	}

	proof := &VerificationProof{
		VerificationHash: employment.VerificationHash,
		CompanyID:        employment.CompanyID,
		Status:           employment.Status,
		Timestamp:        timestamp,
	}

	return proof, nil
}
