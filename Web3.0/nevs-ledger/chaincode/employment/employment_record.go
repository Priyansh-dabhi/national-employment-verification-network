package main

// EmploymentRecord represents an employment relationship between an employee and an employer
type EmploymentRecord struct {
	RecordID   string `json:"recordId"`
	EmployeeID string `json:"employeeId"`
	EmployerID string `json:"employerId"`
	Position   string `json:"position"`
	StartDate  string `json:"startDate"` // ISO8601 string
	EndDate    string `json:"endDate" metadata:",optional"`
	Status     string `json:"status"` // ACTIVE or TERMINATED
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

const (
	StatusActive     = "ACTIVE"
	StatusTerminated = "TERMINATED"

	EmploymentIndexName = "EMPLOYMENT"
	PrivateDataIndexName = "employmentPrivateData"
)

type EmploymentPrivateData struct {
    RecordID     string `json:"recordId"`
    Salary       string `json:"salary"`
    Compensation string `json:"compensation"`
}
