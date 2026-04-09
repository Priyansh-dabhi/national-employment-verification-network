package models

// Company statuses
const (
	CompanyStatusPending   = "PENDING"
	CompanyStatusApproved  = "APPROVED"
	CompanyStatusSuspended = "SUSPENDED"
	CompanyStatusRejected  = "REJECTED"
)

// Company tiers
const (
	CompanyTierSmall      = "TIER_1" // Gateway-only access
	CompanyTierMedium     = "TIER_2" // Optional hosted peer
	CompanyTierEnterprise = "TIER_3" // Own MSP + endorsement
)

type Company struct {
	CompanyID      string `json:"companyId"`
	Name           string `json:"name"`
	RegistrationNo string `json:"registrationNo"`
	Industry       string `json:"industry"`
	Tier           string `json:"tier"`           // TIER_1, TIER_2, TIER_3
	Status         string `json:"status"`         // PENDING, APPROVED, SUSPENDED, REJECTED
	AdminEmail     string `json:"adminEmail"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	ApprovedBy     string `json:"approvedBy"` // Gov admin who approved
	SuspendedAt    string `json:"suspendedAt,omitempty" metadata:",optional"`
	SuspendReason  string `json:"suspendReason,omitempty" metadata:",optional"`
}
