package models

const (
	EmployeeStatusActive   = "ACTIVE"
	EmployeeStatusInactive = "INACTIVE"
)

type Employee struct {
	EmployeeID   string `json:"employeeId"`
	FullName     string `json:"fullName"`
	DateOfBirth  string `json:"dateOfBirth"`
	IDHash       string `json:"idHash"`       // SHA-256 of govt ID (Aadhaar/PAN)
	Status       string `json:"status"`       // ACTIVE, INACTIVE
	RegisteredBy string `json:"registeredBy"` // CompanyID that first registered
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}
