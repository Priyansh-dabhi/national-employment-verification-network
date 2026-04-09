const fs = require('fs'); let code = fs.readFileSync('client/src/pages/dashboard/EmployerDashboard.tsx', 'utf8');

code = code.replace(
  'import { Search, Building, FileCheck, History, Clock, XCircle, CheckCircle, Briefcase, Lock, ArrowRight, Users } from \\'lucide-react\\';',
  'import { employerService } from \\'../../services/employerService\\';\\nimport { Search, Building, FileCheck, History, Clock, XCircle, CheckCircle, Briefcase, Lock, ArrowRight, Users, User, Share } from \\'lucide-react\\';'
);

code = code.replace(
  'const [searchTerm, setSearchTerm] = useState(\\'\\');',
  'const [searchTerm, setSearchTerm] = useState(\\'\\');\\n    const [activeTab, setActiveTab] = useState<\\'employees\\' | \\'candidates\\'>(\\'employees\\');\\n    const [candidates, setCandidates] = useState<any[]>([]);\\n    const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);\\n    const [proposeData, setProposeData] = useState({ position: \\'\\', salary: \\'\\', compensation: \\'\\' });\\n    const [isProposing, setIsProposing] = useState(false);'
);

fs.writeFileSync('client/src/pages/dashboard/EmployerDashboard.tsx', code);
