package models

type VerificationRecord struct {
	VerificationID   string `json:"verificationId"`
	EmploymentID     string `json:"employmentId"`
	EmployeeID       string `json:"employeeId"`
	CompanyID        string `json:"companyId"`
	VerifierID       string `json:"verifierId"`      // e.g. "internshala", "indeed"
	Status           string `json:"status"`            // VERIFIED, NOT_FOUND, MISMATCH
	VerificationHash string `json:"verificationHash"` // Proof hash
	RequestedAt      string `json:"requestedAt"`
	RespondedAt      string `json:"respondedAt,omitempty"`
}
