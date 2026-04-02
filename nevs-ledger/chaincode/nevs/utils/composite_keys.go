package utils

// Composite key index names for world state
const (
	CompanyIndex      = "COMPANY"      // COMPANY~companyId
	EmployeeIndex     = "EMPLOYEE"     // EMPLOYEE~employeeId
	EmploymentIndex   = "EMPLOYMENT"   // EMPLOYMENT~employeeId~employmentId
	EmpByCompanyIndex = "EMP_COMPANY"  // EMP_COMPANY~companyId~employmentId
	VerificationIndex = "VERIFICATION" // VERIFICATION~verificationId
	VerifByEmployment = "VERIF_EMP"    // VERIF_EMP~employmentId~verificationId
)
