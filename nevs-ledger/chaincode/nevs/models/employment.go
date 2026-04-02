package models

const (
	EmploymentStatusProposed   = "PROPOSED"   // Company proposed, awaiting employee consent
	EmploymentStatusConsented  = "CONSENTED"  // Employee consented
	EmploymentStatusConfirmed  = "CONFIRMED"  // Government confirmed (active employment)
	EmploymentStatusTerminated = "TERMINATED" // Employment ended
	EmploymentStatusDisputed   = "DISPUTED"   // Under dispute
)

type Employment struct {
	EmploymentID     string `json:"employmentId"`
	EmployeeID       string `json:"employeeId"`
	CompanyID        string `json:"companyId"`
	Position         string `json:"position"`
	Department       string `json:"department,omitempty" metadata:",optional"`
	StartDate        string `json:"startDate"`
	EndDate          string `json:"endDate,omitempty" metadata:",optional"`
	Status           string `json:"status"`
	VerificationHash string `json:"verificationHash"` // SHA-256(employeeId+companyId+startDate)
	ProposedBy       string `json:"proposedBy"`       // Identity who proposed
	ConsentedAt      string `json:"consentedAt,omitempty" metadata:",optional"`
	ConfirmedAt      string `json:"confirmedAt,omitempty" metadata:",optional"`
	TerminatedAt     string `json:"terminatedAt,omitempty" metadata:",optional"`
	CreatedAt        string `json:"createdAt"`
	UpdatedAt        string `json:"updatedAt"`
}
