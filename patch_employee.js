import fs from 'fs';

let code = fs.readFileSync('client/src/pages/dashboard/EmployeeDashboard.tsx', 'utf8');

// Add JobService import
if (!code.includes("import { jobService } from")) {
    code = code.replace(
      "import { documentService } from '../../services/documentService';",
      "import { documentService } from '../../services/documentService';\nimport { jobService } from '../../services/jobService';"
    );
}

// Add Icons
if (!code.includes("CheckCircle2")) {
    code = code.replace(
      "import { User, FileText, Shield, Calendar, MapPin, Briefcase } from 'lucide-react';",
      "import { User, FileText, Shield, Calendar, MapPin, Briefcase, CheckCircle2, Clock } from 'lucide-react';"
    );
}

// Ensure type DashboardTab encompasses offers
code = code.replace(
  "type DashboardTab = 'profile' | 'verification' | 'documents';",
  "type DashboardTab = 'profile' | 'verification' | 'documents' | 'offers';"
);

code = code.replace(
  "const [documents, setDocuments] = useState<Document[]>([]);",
  "const [documents, setDocuments] = useState<Document[]>([]);\n  const [offers, setOffers] = useState<any[]>([]);\n  const [isConsenting, setIsConsenting] = useState<number | null>(null);"
);

if (!code.includes("const pending = await jobService.getPendingOffers();")) {
    code = code.replace(
      "const docs = await documentService.getDocuments(String(profileUser.id));\n        setDocuments(docs);",
      "const docs = await documentService.getDocuments(String(profileUser.id));\n        setDocuments(docs);\n        try {\n          const pending = await jobService.getPendingOffers();\n          setOffers(pending.offers);\n        } catch(e) { console.error('Failed fetching offers', e); }"
    );
}

if (!code.includes("const handleConsent = async")) {
    code = code.replace(
      "const handleApplyForVerification = async () => {",
      "const handleConsent = async (employerId: number) => {\n    try {\n      setIsConsenting(employerId);\n      await jobService.consentHire(employerId);\n      const pending = await jobService.getPendingOffers();\n      setOffers(pending.offers);\n    } catch(e) {\n      console.error(e);\n    } finally {\n      setIsConsenting(null);\n    }\n  };\n\n  const handleApplyForVerification = async () => {"
    );
}

code = code.replace(
  "(Array.isArray(tabs) ? tabs : ['profile', 'verification', 'documents']).map((tab)",
  "(['profile', 'verification', 'documents', 'offers'] as DashboardTab[]).map((tab)"
);
// In case the static array is used:
code = code.replace(
    "(('profile', 'verification', 'documents') as DashboardTab[]).map((tab)",
    "(['profile', 'verification', 'documents', 'offers'] as DashboardTab[]).map((tab)"
);
code = code.replace(
    "(['profile', 'verification', 'documents'] as DashboardTab[]).map((tab) => (",
    "(['profile', 'verification', 'documents', 'offers'] as DashboardTab[]).map((tab) => ("
);


// Insert Offers Tab Content before BlockchainProofModal Unverified Check
const offerTabStr = `
      {activeTab === 'offers' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={18} color="var(--color-highlight)" /> Pending Job Offers
          </h2>
          {offers.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '1.8rem', color: 'var(--color-text-muted)' }}>
                <p>No pending offers available.</p>
              </div>
            </Card>
          ) : (
            offers.map((offer) => (
              <Card key={offer.proposal_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)' }}>
                    <Briefcase size={20} color="var(--color-highlight)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{offer.position}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{offer.organization_name} — {offer.city}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>Proposed: {new Date(offer.proposed_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <span className="ui-pill" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--color-warning)' }}><Clock size={12}/> Pending Consent</span>
                  <Button variant="primary" onClick={() => handleConsent(offer.employer_id)} isLoading={isConsenting === offer.employer_id}>
                    <CheckCircle2 size={16} /> Accept & Consent
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}
`;

if (!code.includes("Pending Job Offers")) {
    code = code.replace(
      "      <BlockchainProofModal",
      offerTabStr + "\n      <BlockchainProofModal"
    );
}

fs.writeFileSync('client/src/pages/dashboard/EmployeeDashboard.tsx', code);
