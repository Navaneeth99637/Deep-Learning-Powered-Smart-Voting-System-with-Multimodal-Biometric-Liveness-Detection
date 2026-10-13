import React, { useState, useEffect, useRef, useMemo } from 'react';

// ==========================================
// CONSTANTS, DEMO DATABASE & SEED RECORDS
// ==========================================

const ELECTION_DETAILS = {
  id: "ELEC-2026-US-NCYC",
  name: "2026 National Cyber & Technology Governance Council Election",
  jurisdiction: "Federal Cyber Infrastructure Directorate",
  activeUntil: "November 4, 2026 - 20:00 EST",
  status: "ACTIVE_IN_SESSION",
  totalEligible: 28450
};

const DEMO_ACCOUNTS = {
  "VTR-88219": {
    id: "VTR-88219",
    name: "Alice Chen",
    role: "VOTER",
    dob: "1994-08-14",
    district: "Metro Sector 4B",
    registrationDate: "2024-02-11",
    eligibilityStatus: "ELIGIBLE",
    hasVoted: false,
    verificationStatus: "NOT_STARTED", // NOT_STARTED, IN_PROGRESS, PASSED, FAILED
    avatarInitials: "AC",
    scenarioDescription: "Standard Eligible Voter (Ready for genuine multimodal verification & voting)"
  },
  "VTR-55410": {
    id: "VTR-55410",
    name: "Marcus Vance",
    role: "VOTER",
    dob: "1988-11-23",
    district: "Pacific Coastal Ward 9",
    registrationDate: "2023-09-18",
    eligibilityStatus: "BLOCKED_ALREADY_VOTED",
    hasVoted: true,
    verificationStatus: "PASSED",
    avatarInitials: "MV",
    receiptId: "RCPT-9844-3210-MV",
    scenarioDescription: "Simulated Double-Vote Prevention (Ballot already logged; duplicate attempt blocked)"
  },
  "VTR-10294": {
    id: "VTR-10294",
    name: "Elena Rostova",
    role: "VOTER",
    dob: "1999-04-05",
    district: "Highland District 2",
    registrationDate: "2025-01-10",
    eligibilityStatus: "FLAGGED_SPOOF_RISK",
    hasVoted: false,
    verificationStatus: "FAILED",
    avatarInitials: "ER",
    scenarioDescription: "Presentation Attack Demo (Demonstrates 2D Photo/Screen spoof detection failure)"
  },
  "ADM-001": {
    id: "ADM-001",
    name: "Dr. S. Nair",
    role: "ADMINISTRATOR",
    designation: "Chief Electoral Systems Officer",
    clearance: "LEVEL-IV-CRYPTOGRAPHIC",
    avatarInitials: "SN",
    scenarioDescription: "Full Administrative Operations, Security Analytics, and Verification Policy Config"
  },
  "AUD-709": {
    id: "AUD-709",
    name: "K. Lindqvist",
    role: "AUDITOR",
    designation: "Independent Cyber Biometrics Auditor",
    clearance: "AUDIT-READONLY-VERIFIABLE",
    avatarInitials: "KL",
    scenarioDescription: "Tamper-evident Immutable Audit Trails & Zero-Knowledge Verification Inspection"
  }
};

const CANDIDATES = [
  {
    id: "CAN-01",
    name: "Dr. Maya Arisawa",
    party: "Digital Rights & Open Systems Alliance",
    slogan: "Open Algorithms, Transparent Governance, Universal Privacy",
    platform: "Mandating open-source cryptographic audits for public AI and expanding quantum-safe identity protections.",
    symbol: "🌐",
    accent: "border-teal-500"
  },
  {
    id: "CAN-02",
    name: "Col. Jason Mercer (Ret.)",
    party: "National Cyber Resilience Coalition",
    slogan: "Hardened Infrastructure, Sovereign Data Security",
    platform: "Zero-trust edge security protocols, strict biometric cross-verification, and cyber critical defense funding.",
    symbol: "🛡️",
    accent: "border-blue-600"
  },
  {
    id: "CAN-03",
    name: "Priya Sundaram",
    party: "Sustainable Compute & Ethical AI Initiative",
    slogan: "Clean Energy Data Hubs, Responsible Machine Learning",
    platform: "Decarbonizing national AI data centers while introducing strict bias mitigations in public sector vision models.",
    symbol: "🌱",
    accent: "border-emerald-500"
  },
  {
    id: "CAN-04",
    name: "David Vance",
    party: "Civic Tech Modernization Front",
    slogan: "Frictionless Civic Services, Citizen Sovereignty",
    platform: "Unified civic wallet architectures, rapid mobile democratic access, and decentralized ballot verifiability.",
    symbol: "⚡",
    accent: "border-purple-500"
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: "EVT-80921",
    timestamp: "2026-10-12 18:22:04",
    actor: "VTR-88219 (ANON-HASH-7F)",
    eventType: "SESSION_INITIALIZED",
    factor: "AUTH_GATEWAY",
    outcome: "SUCCESS",
    reasonCode: "TOKEN_NONCE_ISSUED",
    severity: "INFO"
  },
  {
    id: "EVT-80922",
    timestamp: "2026-10-12 18:24:19",
    actor: "VTR-10294 (ANON-HASH-2A)",
    eventType: "FACE_SPOOF_SUSPECTED",
    factor: "FACE_LIVENESS",
    outcome: "REJECTED",
    reasonCode: "LIVENESS_FAILED_PRINT_TEXTURE_DETECTED",
    severity: "CRITICAL"
  },
  {
    id: "EVT-80923",
    timestamp: "2026-10-12 18:26:41",
    actor: "VTR-55410 (ANON-HASH-9C)",
    eventType: "DUPLICATE_SUBMISSION_BLOCKED",
    factor: "BALLOT_STORE",
    outcome: "BLOCKED",
    reasonCode: "EXISTING_BALLOT_HASH_PRESENT",
    severity: "WARN"
  },
  {
    id: "EVT-80924",
    timestamp: "2026-10-12 18:30:11",
    actor: "SYS-ORCHESTRATOR",
    eventType: "MERKLE_TREE_BATCH_SEALED",
    factor: "CRYPTOGRAPHIC_ROOT",
    outcome: "SUCCESS",
    reasonCode: "ROOT_SEALED_SHA256_F8210A",
    severity: "INFO"
  },
  {
    id: "EVT-80925",
    timestamp: "2026-10-12 18:35:49",
    actor: "ADM-001",
    eventType: "ADMIN_CONFIGURATION_CHANGED",
    factor: "POLICY_ENGINE",
    outcome: "LOGGED",
    reasonCode: "FACE_LIVENESS_THRESHOLD_UPDATED_0.92",
    severity: "WARN"
  }
];

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState(DEMO_ACCOUNTS["VTR-88219"]);
  const [activeTab, setActiveTab] = useState("landing"); // landing, login, voter-dash, verification, ballot, receipt, admin-dash, audit-log, architecture
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Mock Database State
  const [votersDb, setVotersDb] = useState(DEMO_ACCOUNTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [votesCastCount, setVotesCastCount] = useState(1482);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Biometric Policy Configurations (Administrator Controlled)
  const [sysConfig, setSysConfig] = useState({
    faceLivenessThreshold: 0.90,
    fingerprintMinutiaeThreshold: 0.85,
    voiceAntiReplayEnabled: false,
    maxVerificationAttempts: 3,
    operatingMode: "DEMO_SIMULATION", // "DEMO_SIMULATION" or "HYBRID_LIVE_SENSORS"
    zeroKnowledgeProofEnabled: true
  });

  // Verification Wizard State
  const [verificationSession, setVerificationSession] = useState({
    sessionId: null,
    startedAt: null,
    faceStatus: "PENDING", // PENDING, PROCESSING, PASSED, FAILED
    fingerprintStatus: "PENDING",
    voiceStatus: "NOT_REQUIRED", // NOT_REQUIRED, PENDING, PASSED, FAILED
    overallDecision: "INCOMPLETE",
    verificationToken: null,
    failureReason: null,
    metrics: {}
  });

  // Notification Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Helper to append audit events (Strictly pseudonymized - NO raw biometrics, NO choices)
  const logAuditEvent = (eventType, actorId, factor, outcome, reasonCode, severity = "INFO") => {
    const newLog = {
      id: `EVT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: `${actorId} (HASH-${Math.random().toString(36).substring(2, 6).toUpperCase()})`,
      eventType,
      factor,
      outcome,
      reasonCode,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (userKey) => {
    const user = votersDb[userKey];
    setCurrentUser(user);
    if (user.role === "VOTER") {
      setActiveTab("voter-dash");
    } else if (user.role === "ADMINISTRATOR") {
      setActiveTab("admin-dash");
    } else {
      setActiveTab("audit-log");
    }
    showToast(`Authenticated as ${user.name} (${user.role})`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("login");
    showToast("Session terminated securely.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-sky-800/40 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          ACADEMIC RESEARCH PROTOTYPE
        </span>
        <span className="text-slate-300 hidden sm:inline">
          SmartVote AI demonstrates multi-modal anti-spoofing & liveness architectures. Not certified for municipal or state elections.
        </span>
        <span className="text-teal-400 font-mono text-[11px] font-medium ml-2">
          Mode: {sysConfig.operatingMode === "DEMO_SIMULATION" ? "Simulated Testbed" : "Sensor Pipeline"}
        </span>
      </div>

      {}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab(currentUser ? (currentUser.role === 'VOTER' ? 'voter-dash' : 'admin-dash') : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-400 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-lg">SmartVote</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/40">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">LIVENESS & IDENTITY GUARANTEE</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button 
              onClick={() => setActiveTab('landing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'landing' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Overview
            </button>
            {currentUser?.role === 'VOTER' && (
              <>
                <button 
                  onClick={() => setActiveTab('voter-dash')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'voter-dash' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Voter Hub
                </button>
                <button 
                  onClick={() => setActiveTab('verification')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'verification' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Biometric Wizard
                </button>
                <button 
                  onClick={() => setActiveTab('ballot')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'ballot' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Secure Ballot
                </button>
              </>
            )}
            {(currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'AUDITOR') && (
              <>
                <button 
                  onClick={() => setActiveTab('admin-dash')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'admin-dash' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Admin Metrics
                </button>
                <button 
                  onClick={() => setActiveTab('audit-log')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'audit-log' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Immutable Audit
                </button>
              </>
            )}
            <button 
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'architecture' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ML Models Card
            </button>
          </nav>

          {/* User Profile / Quick Login Dropdown */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    {currentUser.name}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      currentUser.role === 'ADMINISTRATOR' ? 'bg-blue-500/20 text-blue-300' :
                      currentUser.role === 'AUDITOR' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-teal-500/20 text-teal-300'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentUser.id}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-teal-400">
                  {currentUser.avatarInitials}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out session"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Launch Demo Login</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
            <button 
              onClick={() => { setActiveTab('landing'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded"
            >
              System Overview
            </button>
            <button 
              onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded"
            >
              Switch Role / Demo Accounts
            </button>
            {currentUser?.role === 'VOTER' && (
              <>
                <button 
                  onClick={() => { setActiveTab('voter-dash'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-teal-400 hover:bg-slate-800 rounded"
                >
                  Voter Hub
                </button>
                <button 
                  onClick={() => { setActiveTab('verification'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-teal-400 hover:bg-slate-800 rounded"
                >
                  Biometric Liveness Wizard
                </button>
                <button 
                  onClick={() => { setActiveTab('ballot'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-teal-400 hover:bg-slate-800 rounded"
                >
                  Cast Secure Ballot
                </button>
              </>
            )}
            <button 
              onClick={() => { setActiveTab('admin-dash'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-sky-400 hover:bg-slate-800 rounded"
            >
              Admin Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('audit-log'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-slate-800 rounded"
            >
              Immutable Audit Log
            </button>
            <button 
              onClick={() => { setActiveTab('architecture'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded"
            >
              ML Architecture
            </button>
          </div>
        )}
      </header>

      {}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce transition-all">
          <div className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50' :
            toast.type === 'danger' ? 'bg-rose-950/90 text-rose-200 border-rose-500/50' :
            toast.type === 'warn' ? 'bg-amber-950/90 text-amber-200 border-amber-500/50' :
            'bg-slate-900/90 text-slate-200 border-slate-700'
          }`}>
            <span className="text-lg">
              {toast.type === 'success' ? '✓' : toast.type === 'danger' ? '✕' : toast.type === 'warn' ? '⚠' : 'ℹ'}
            </span>
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {}
      <main className="flex-1 flex flex-col">
        {activeTab === 'landing' && <LandingPage onGoToLogin={() => setActiveTab('login')} onSelectRole={handleLogin} />}
        {activeTab === 'login' && <LoginPage onLogin={handleLogin} accounts={votersDb} />}
        {activeTab === 'voter-dash' && (
          <VoterDashboard 
            user={currentUser} 
            election={ELECTION_DETAILS}
            onStartVerification={() => setActiveTab('verification')}
            onGoToBallot={() => setActiveTab('ballot')}
          />
        )}
        {activeTab === 'verification' && (
          <BiometricVerificationWizard 
            currentUser={currentUser}
            sysConfig={sysConfig}
            onVerificationComplete={(result) => {
              setVerificationSession(result);
              // Update user record in local state
              setVotersDb(prev => ({
                ...prev,
                [currentUser.id]: {
                  ...prev[currentUser.id],
                  verificationStatus: result.overallDecision === 'PASSED' ? 'PASSED' : 'FAILED'
                }
              }));
              logAuditEvent(
                result.overallDecision === 'PASSED' ? 'VOTER_VERIFICATION_COMPLETED' : 'VOTER_VERIFICATION_REJECTED',
                currentUser.id,
                'MULTIMODAL_ENGINE',
                result.overallDecision,
                result.failureReason || 'ALL_MANDATORY_CRITERIA_SATISFIED',
                result.overallDecision === 'PASSED' ? 'INFO' : 'CRITICAL'
              );
              if (result.overallDecision === 'PASSED') {
                showToast("Identity & Liveness confirmed. Ballot unlocked.", "success");
              } else {
                showToast(`Verification Failed: ${result.failureReason}`, "danger");
              }
            }}
            onProceedToBallot={() => setActiveTab('ballot')}
          />
        )}
        {activeTab === 'ballot' && (
          <SecureBallotPage 
            currentUser={currentUser}
            election={ELECTION_DETAILS}
            verificationSession={verificationSession}
            candidates={CANDIDATES}
            onSubmitBallot={(candidateId) => {
              // Block if already voted
              if (currentUser.hasVoted) {
                logAuditEvent(
                  'DUPLICATE_SUBMISSION_BLOCKED',
                  currentUser.id,
                  'BALLOT_INTEGRITY',
                  'BLOCKED',
                  'DOUBLE_VOTE_RECORDED_TAMPER_PREVENTED',
                  'CRITICAL'
                );
                showToast("Duplicate vote blocked! Record is permanently sealed.", "danger");
                return;
              }

              // Create receipt without revealing candidateId!
              const receipt = {
                receiptId: `RCPT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-ZK`,
                electionId: ELECTION_DETAILS.id,
                timestamp: new Date().toISOString(),
                anonymizedVoterHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                merkleProofRoot: `0x${Math.random().toString(16).substring(2, 12)}...`,
                status: "CONFIRMED_ANONYMOUSLY_RECORDED"
              };

              setLastReceipt(receipt);
              setVotesCastCount(c => c + 1);

              // Update voter status
              setVotersDb(prev => ({
                ...prev,
                [currentUser.id]: {
                  ...prev[currentUser.id],
                  hasVoted: true,
                  eligibilityStatus: "VOTE_CAST_COMPLETED",
                  receiptId: receipt.receiptId
                }
              }));
              setCurrentUser(prev => ({
                ...prev,
                hasVoted: true,
                eligibilityStatus: "VOTE_CAST_COMPLETED",
                receiptId: receipt.receiptId
              }));

              logAuditEvent(
                'BALLOT_CRYPTOGRAPHICALLY_SEALED',
                currentUser.id,
                'ZERO_KNOWLEDGE_SINK',
                'SUCCESS',
                `RECEIPT_EMITTED_${receipt.receiptId}`,
                'INFO'
              );

              setActiveTab('receipt');
              showToast("Ballot recorded with Zero-Knowledge verification proof!", "success");
            }}
          />
        )}
        {activeTab === 'receipt' && (
          <ReceiptPage 
            receipt={lastReceipt || {
              receiptId: currentUser?.receiptId || "RCPT-PREV-SEALED",
              electionId: ELECTION_DETAILS.id,
              timestamp: new Date().toISOString(),
              anonymizedVoterHash: "SHA256-STORED-ON-LEDGER",
              merkleProofRoot: "0x77AB019F4...",
              status: "OFFICIAL_PROTOTYPE_SEAL"
            }}
            user={currentUser}
            onGoToHome={() => setActiveTab('voter-dash')}
          />
        )}
        {activeTab === 'admin-dash' && (
          <AdminDashboard 
            totalEligible={ELECTION_DETAILS.totalEligible}
            votesCast={votesCastCount}
            auditLogs={auditLogs}
            sysConfig={sysConfig}
            setSysConfig={(newCfg) => {
              setSysConfig(newCfg);
              logAuditEvent('ADMIN_CONFIGURATION_CHANGED', currentUser?.id || 'ADM-001', 'CONFIG_REGISTRY', 'UPDATED', 'THRESHOLDS_RECALIBRATED', 'WARN');
              showToast("Biometric and Liveness parameters updated.", "info");
            }}
            votersDb={votersDb}
          />
        )}
        {activeTab === 'audit-log' && (
          <AuditLogPage 
            logs={auditLogs} 
            onFilter={(query) => {}}
          />
        )}
        {activeTab === 'architecture' && (
          <ArchitectureSpecPage 
            sysConfig={sysConfig}
            onToggleMode={(mode) => setSysConfig(prev => ({ ...prev, operatingMode: mode }))}
          />
        )}
      </main>

      {}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SmartVote AI · Academic Research Demo</span>
            <span className="text-slate-700">|</span>
            <span>Zero-Knowledge Proof Enabled</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Model Spec: MiniFASNetV2 + ASVspoof-2024</span>
            <span>SHA-256 State Hash</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function LandingPage({ onGoToLogin, onSelectRole }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            DEFENSE-GRADE MULTIMODAL ANTI-SPOOFING
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Verify securely. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-indigo-400">
              Vote confidently.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-light">
            A high-assurance digital voting prototype integrating Deep Learning Face Liveness (MiniFASNet), ISO Fingerprint Minutiae extraction, and Zero-Knowledge Ballot Isolation to eradicate presentation attacks without compromising voter anonymity.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onSelectRole('VTR-88219')}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Voter Flow (Alice Chen)</span>
            </button>

            <button
              onClick={() => onSelectRole('ADM-001')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Admin Telemetry Hub</span>
            </button>

            <button
              onClick={onGoToLogin}
              className="px-5 py-3 rounded-xl bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 text-sm font-mono transition-colors"
            >
              All Role Scenarios →
            </button>
          </div>

          {/* Academic Prototype Disclaimer Callout */}
          <div className="mt-12 max-w-2xl mx-auto p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 text-left flex items-start gap-3">
            <span className="text-amber-400 text-xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Academic Prototype & Research Ethics Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                This software is constructed for collegiate engineering defense and benchmarking. Real-world elections require statutory air-gapped certified paper audit trails (VVPAT). Facial recognition models can experience demographic variance; in production, redundant non-biometric supervisory override paths are mandatory.
              </p>
            </div>
          </div>

        </div>
      </section>

      {}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white text-center mb-2">The Multi-Tiered Verification Protocol</h2>
        <p className="text-slate-400 text-center text-sm mb-12 max-w-xl mx-auto">
          Combining deep representation liveness checking with strict separation of voter identity and ballot payload.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg mb-4 border border-teal-500/30">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">Multimodal Liveness Check</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Camera frame passes through Fourier high-frequency texture analysis, reflection depth inference, and CNN liveness. Prints, digital screens, and silicone masks trigger immediate rejection.
            </p>
            <div className="text-[11px] font-mono text-teal-400 bg-slate-950 p-2 rounded border border-slate-800">
              Model: MiniFASNet-ResNet18 · Threshold: 0.90
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-sky-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg mb-4 border border-sky-500/30">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">Zero-Knowledge Tokenization</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Upon biometric verification, an ephemeral, session-bound verification token is generated. Biometric data is scrubbed from transient memory; no raw imagery ever reaches the ballot ledger.
            </p>
            <div className="text-[11px] font-mono text-sky-400 bg-slate-950 p-2 rounded border border-slate-800">
              Token: SHA-256 Nonce with 120s Expiry
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/30">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">Cryptographic Ballot Cast</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The user selects their candidate. The ballot choice is cryptographically blinded and recorded to an append-only store. The voter receives an immutable receipt hash proving ballot inclusion.
            </p>
            <div className="text-[11px] font-mono text-indigo-400 bg-slate-950 p-2 rounded border border-slate-800">
              Guarantee: Double-Vote Lock & Anonymity
            </div>
          </div>

        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-12 bg-slate-900/40 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl mb-3">👁️</div>
              <h4 className="text-sm font-bold text-white mb-1">Face Anti-Spoofing</h4>
              <p className="text-xs text-slate-400">Classifies presentation attacks (2D paper prints, tablet screen replays, 3D masks) via CNN texture classification.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl mb-3">👆</div>
              <h4 className="text-sm font-bold text-white mb-1">Fingerprint Minutiae</h4>
              <p className="text-xs text-slate-400">ISO/IEC standard bifurcation & ridge termination extraction with automated latent smudge rejection.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl mb-3">🎙️</div>
              <h4 className="text-sm font-bold text-white mb-1">Voice Anti-Replay</h4>
              <p className="text-xs text-slate-400">Optional challenge-response phrase analysis with spectral replay detection and speaker voiceprint matching.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl mb-3">🔒</div>
              <h4 className="text-sm font-bold text-white mb-1">Strict Ballot Isolation</h4>
              <p className="text-xs text-slate-400">Logical segregation prevents correlation of candidate choice to voter identity, even in the event of audit scrutiny.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function LoginPage({ onLogin, accounts }) {
  const [selectedUserKey, setSelectedUserKey] = useState("VTR-88219");

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Left Side: Credentials Selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">Access Control Gateway</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to SmartVote</h2>
          <p className="text-xs text-slate-400 mb-6">
            Select one of the pre-configured academic defense test scenarios below to explore diverse system behaviors.
          </p>

          <div className="space-y-3">
            {Object.values(accounts).map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelectedUserKey(acc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUserKey === acc.id 
                    ? 'bg-slate-800/90 border-teal-500 shadow-md shadow-teal-500/10' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{acc.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({acc.id})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    acc.role === 'ADMINISTRATOR' ? 'bg-sky-500/20 text-sky-300' :
                    acc.role === 'AUDITOR' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-teal-500/20 text-teal-300'
                  }`}>
                    {acc.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{acc.scenarioDescription}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form Simulator */}
        <div className="flex flex-col justify-between bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
              Demo Credentials Profile
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Identifier / Voter ID</label>
                <input 
                  type="text" 
                  value={selectedUserKey}
                  readOnly
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-teal-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Authentication Mode</label>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>Hardware Nonce + Biometric Token</span>
                  <span className="text-[10px] font-mono text-emerald-400">READY</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                <span className="text-[11px] text-slate-400 block mb-1">Selected Scenario Outcome:</span>
                <span className="text-xs font-semibold text-teal-300">
                  {selectedUserKey === "VTR-88219" && "✨ Clean path: Complete Face & Fingerprint -> Cast vote"}
                  {selectedUserKey === "VTR-55410" && "⛔ Rejection: System detects previously cast ballot"}
                  {selectedUserKey === "VTR-10294" && "⚠️ Rejection: Face spoof detection flags fake presentation"}
                  {selectedUserKey === "ADM-001" && "📊 Live admin metrics, failure telemetry & policy dials"}
                  {selectedUserKey === "AUD-709" && "📜 Immutable zero-knowledge append-only audit trail"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onLogin(selectedUserKey)}
            className="w-full mt-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Session</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

function VoterDashboard({ user, election, onStartVerification, onGoToBallot }) {
  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              VOTER PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered Precinct: <strong className="text-slate-200">{user.district}</strong> · DOB: {user.dob}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Eligibility Status</div>
            <div className={`text-xs font-bold font-mono ${
              user.hasVoted ? 'text-blue-400' :
              user.verificationStatus === 'FAILED' ? 'text-rose-400' :
              user.verificationStatus === 'PASSED' ? 'text-emerald-400' :
              'text-amber-400'
            }`}>
              {user.hasVoted ? 'BALLOT_ALREADY_RECORDED' :
               user.verificationStatus === 'FAILED' ? 'BIOMETRIC_REJECTED' :
               user.verificationStatus === 'PASSED' ? 'VERIFIED_READY_TO_VOTE' :
               'VERIFICATION_MANDATORY'}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            user.hasVoted ? 'bg-blue-400' :
            user.verificationStatus === 'FAILED' ? 'bg-rose-500' :
            user.verificationStatus === 'PASSED' ? 'bg-emerald-500' :
            'bg-amber-400 animate-ping'
          }`}></div>
        </div>
      </div>

      {/* Active Election Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LIVE BALLOT OPEN
              </span>
              <span className="text-xs text-slate-400 font-mono">Session Ref: {election.id}</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{election.name}</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Authority: {election.jurisdiction}. To ensure non-repudiation, voters must successfully undergo real-time deep facial anti-spoofing and minutiae validation prior to accessing the cryptographic ballot.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Closes: <span className="text-slate-200 font-mono">{election.activeUntil}</span>
            </div>

            {user.hasVoted ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                <span>✓ Vote Submitted</span>
                <span className="font-mono text-[10px]">({user.receiptId || "RECEIPT_SEALED"})</span>
              </div>
            ) : user.verificationStatus === 'PASSED' ? (
              <button
                onClick={onGoToBallot}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span>Access Ballot Sheet</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onStartVerification}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
              >
                <span>Begin Biometric Liveness Check</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Verification Progress Checklist */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-4">
            Voter Security Status
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Voter Registry Check</span>
              <span className="text-emerald-400 font-mono font-bold">✓ PASSED</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Double-Vote Prevention</span>
              <span className={`font-mono font-bold ${user.hasVoted ? 'text-rose-400' : 'text-emerald-400'}`}>
                {user.hasVoted ? '⛔ LOCKED (VOTED)' : '✓ ELIGIBLE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Face Liveness (MiniFASNet)</span>
              <span className={`font-mono font-bold ${
                user.verificationStatus === 'PASSED' ? 'text-emerald-400' :
                user.verificationStatus === 'FAILED' ? 'text-rose-400' :
                'text-amber-400'
              }`}>
                {user.verificationStatus === 'PASSED' ? '✓ VERIFIED' :
                 user.verificationStatus === 'FAILED' ? '✕ FAILED' :
                 'PENDING'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Fingerprint Minutiae Match</span>
              <span className={`font-mono font-bold ${
                user.verificationStatus === 'PASSED' ? 'text-emerald-400' :
                user.verificationStatus === 'FAILED' ? 'text-rose-400' :
                'text-amber-400'
              }`}>
                {user.verificationStatus === 'PASSED' ? '✓ MATCHED' :
                 user.verificationStatus === 'FAILED' ? '✕ FAILED' :
                 'PENDING'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cryptographic Ballot Token</span>
              <span className={`font-mono font-bold ${user.verificationStatus === 'PASSED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {user.verificationStatus === 'PASSED' ? 'ISSUED (VALID)' : 'LOCKED'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function BiometricVerificationWizard({ currentUser, sysConfig, onVerificationComplete, onProceedToBallot }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Face Liveness, 2: Fingerprint, 3: Voice (optional), 4: Summary

  // Module A: Face Liveness State
  const [cameraActive, setCameraActive] = useState(false);
  const [faceChecking, setFaceChecking] = useState(false);
  const [faceAttackScenario, setFaceAttackScenario] = useState("GENUINE"); // GENUINE, 2D_PRINT_ATTACK, SCREEN_REPLAY_ATTACK
  const [faceTelemetry, setFaceTelemetry] = useState(null);
  const videoRef = useRef(null);

  // Module B: Fingerprint State
  const [fingerprintScanning, setFingerprintScanning] = useState(false);
  const [fingerprintScenario, setFingerprintScenario] = useState("MATCH"); // MATCH, MISMATCH, SMUDGE
  const [fingerprintTelemetry, setFingerprintTelemetry] = useState(null);

  // Module C: Voice State
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTelemetry, setVoiceTelemetry] = useState(null);

  // Final Overall State
  const [finalResult, setFinalResult] = useState(null);

  // Camera cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera API not accessible or permission denied, fallback to simulated sensor:", err);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Run Face Verification & Anti-Spoofing Inference
  const runFaceAnalysis = () => {
    setFaceChecking(true);
    setFaceTelemetry(null);

    setTimeout(() => {
      setFaceChecking(false);
      let livenessScore = 0.94;
      let identityMatchScore = 0.96;
      let passed = true;
      let reason = "AUTHENTIC_LIVE_SUBJECT";

      if (faceAttackScenario === "2D_PRINT_ATTACK") {
        livenessScore = 0.23; // Fails threshold of 0.90
        identityMatchScore = 0.92; // Identity matches, but LIVENESS FAILS!
        passed = false;
        reason = "LIVENESS_FAILED_PRINT_TEXTURE_DETECTED";
      } else if (faceAttackScenario === "SCREEN_REPLAY_ATTACK") {
        livenessScore = 0.38;
        identityMatchScore = 0.89;
        passed = false;
        reason = "LIVENESS_FAILED_MOIRE_PATTERN_REPLAY";
      }

      const res = {
        passed,
        livenessScore,
        identityMatchScore,
        fourierTextureAnomaly: faceAttackScenario === "GENUINE" ? 0.04 : 0.88,
        depthGradientDisparity: faceAttackScenario === "GENUINE" ? 0.91 : 0.12,
        reason
      };
      setFaceTelemetry(res);
    }, 1800);
  };

  // Run Fingerprint Minutiae Scan
  const runFingerprintScan = () => {
    setFingerprintScanning(true);
    setFingerprintTelemetry(null);

    setTimeout(() => {
      setFingerprintScanning(false);
      let score = 0.92;
      let passed = true;
      let reason = "MINUTIAE_MATCH_CONFIRMED";

      if (fingerprintScenario === "MISMATCH") {
        score = 0.31;
        passed = false;
        reason = "MINUTIAE_POINTS_NON_CONGRUENT";
      } else if (fingerprintScenario === "SMUDGE") {
        score = 0.44;
        passed = false;
        reason = "SENSOR_LATENT_SMUDGE_LOW_QUALITY";
      }

      setFingerprintTelemetry({
        passed,
        score,
        minutiaeCount: fingerprintScenario === "SMUDGE" ? 7 : 38,
        ridgeClarity: fingerprintScenario === "SMUDGE" ? 0.35 : 0.94,
        reason
      });
    }, 1600);
  };

  // Run Voice Scan
  const runVoiceScan = () => {
    setVoiceRecording(true);
    setVoiceTelemetry(null);

    setTimeout(() => {
      setVoiceRecording(false);
      setVoiceTelemetry({
        passed: true,
        speakerVerificationScore: 0.91,
        antiReplayScore: 0.96,
        snrDb: 24.8,
        reason: "VOICE_LIVENESS_CONFIRMED"
      });
    }, 2000);
  };

  // Final Decision Matrix Aggregator
  const computeFinalDecision = () => {
    const facePass = faceTelemetry?.passed === true;
    const fpPass = fingerprintTelemetry?.passed === true;
    const voicePass = !sysConfig.voiceAntiReplayEnabled || (voiceTelemetry?.passed === true);

    const overallPassed = facePass && fpPass && voicePass;
    let failureReason = null;

    if (!facePass) {
      failureReason = faceTelemetry?.reason || "FACE_LIVENESS_FAILED";
    } else if (!fpPass) {
      failureReason = fingerprintTelemetry?.reason || "FINGERPRINT_FAILED";
    } else if (!voicePass) {
      failureReason = "VOICE_REPLAY_FAILED";
    }

    const result = {
      sessionId: `SES-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      faceStatus: facePass ? "PASSED" : "FAILED",
      fingerprintStatus: fpPass ? "PASSED" : "FAILED",
      voiceStatus: sysConfig.voiceAntiReplayEnabled ? (voicePass ? "PASSED" : "FAILED") : "NOT_REQUIRED",
      overallDecision: overallPassed ? "PASSED" : "FAILED",
      verificationToken: overallPassed ? `TOKEN-SHA256-${Math.random().toString(36).substring(2, 14).toUpperCase()}` : null,
      failureReason,
      metrics: {
        faceLivenessScore: faceTelemetry?.livenessScore,
        fingerprintScore: fingerprintTelemetry?.score
      }
    };

    setFinalResult(result);
    onVerificationComplete(result);
    setCurrentStep(4);
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Wizard Header & Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-teal-400">MULTIMODAL BIOMETRIC ENGINE</span>
          <span className="text-xs font-mono text-slate-400">Step {currentStep} of 4</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Biometric Liveness Verification</h1>
        <p className="text-xs text-slate-400">
          Evaluates deep neural representations for presentation attacks. High face identity scores <strong className="text-rose-400">will NOT</strong> override failed anti-spoofing checks.
        </p>

        {/* Steps Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <div className={`h-1.5 rounded-full ${currentStep >= 1 ? 'bg-teal-400' : 'bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full ${currentStep >= 2 ? 'bg-teal-400' : 'bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full ${currentStep >= 3 ? 'bg-teal-400' : 'bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full ${currentStep >= 4 ? 'bg-teal-400' : 'bg-slate-800'}`}></div>
        </div>
      </div>

      {/* STEP 1: FACE VERIFICATION & LIVENESS */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Module A: Facial Deep Liveness & Anti-Spoofing</h2>
              <p className="text-xs text-slate-400">MiniFASNet CNN · Texture Fourier Analysis · Depth Disparity</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Threshold: ≥ {sysConfig.faceLivenessThreshold.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Visualizer / Camera View */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-2xl mb-2 text-slate-400">
                    👤
                  </div>
                  <p className="text-xs text-slate-400">Interactive Synthetic Sensor Preview</p>
                  <p className="text-[11px] text-teal-400/80 font-mono mt-1">Ready for feature capture</p>
                </div>
              )}

              {/* Target Face Bounding Box Overlay */}
              <div className="absolute inset-8 border border-teal-500/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-4 h-4 border-t-2 border-l-2 border-teal-400 absolute top-0 left-0"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-teal-400 absolute top-0 right-0"></div>
                <div className="w-4 h-4 border-b-2 border-l-2 border-teal-400 absolute bottom-0 left-0"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-teal-400 absolute bottom-0 right-0"></div>
                {faceChecking && (
                  <div className="text-xs font-mono bg-slate-950/90 text-teal-400 px-3 py-1 rounded border border-teal-500/50 animate-pulse">
                    ANALYZING FOURIER FREQUENCIES...
                  </div>
                )}
              </div>

              {/* Live WebRTC Toggle */}
              <div className="absolute bottom-2 right-2">
                {!cameraActive ? (
                  <button 
                    onClick={handleStartCamera}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700"
                  >
                    Use WebRTC Cam
                  </button>
                ) : (
                  <button 
                    onClick={handleStopCamera}
                    className="px-2.5 py-1 text-[11px] rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-mono"
                  >
                    Stop Cam
                  </button>
                )}
              </div>
            </div>

            {/* Test Controls & Results */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Presentation Attack Simulator (Academic Defense Tool):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setFaceAttackScenario("GENUINE")}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                      faceAttackScenario === "GENUINE" ? 'bg-teal-500/10 border-teal-500 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">✓ Live Human Face (Genuine)</span>
                    <span className="text-[10px] text-slate-500">Natural micro-tremor & 3D gradient</span>
                  </button>

                  <button
                    onClick={() => setFaceAttackScenario("2D_PRINT_ATTACK")}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                      faceAttackScenario === "2D_PRINT_ATTACK" ? 'bg-rose-500/10 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">⚠️ 2D Photo Print Attack (Spoof)</span>
                    <span className="text-[10px] text-slate-500">Paper specular reflection & flat plane</span>
                  </button>

                  <button
                    onClick={() => setFaceAttackScenario("SCREEN_REPLAY_ATTACK")}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                      faceAttackScenario === "SCREEN_REPLAY_ATTACK" ? 'bg-rose-500/10 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">⚠️ Digital Screen Replay (Tablet Spoof)</span>
                    <span className="text-[10px] text-slate-500">Moiré pixel pattern & refresh cycle</span>
                  </button>
                </div>
              </div>

              <button
                disabled={faceChecking}
                onClick={runFaceAnalysis}
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
              >
                {faceChecking ? "Inference in Progress..." : "Run Liveness & Identity Inference"}
              </button>

              {/* Telemetry Output */}
              {faceTelemetry && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  faceTelemetry.passed ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-2">
                    <span className={faceTelemetry.passed ? 'text-emerald-300' : 'text-rose-300'}>
                      {faceTelemetry.passed ? '✓ LIVENESS VERIFIED' : '✕ PRESENTATION ATTACK DETECTED'}
                    </span>
                    <span className="font-mono text-[11px]">{faceTelemetry.reason}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                    <div>Liveness Score: <strong className={faceTelemetry.livenessScore >= 0.90 ? 'text-emerald-400' : 'text-rose-400'}>{faceTelemetry.livenessScore.toFixed(3)}</strong></div>
                    <div>Identity Match: <strong>{faceTelemetry.identityMatchScore.toFixed(3)}</strong></div>
                    <div>Texture Anomaly: <strong>{faceTelemetry.fourierTextureAnomaly}</strong></div>
                    <div>Depth Gradient: <strong>{faceTelemetry.depthGradientDisparity}</strong></div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <button
              disabled={!faceTelemetry}
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2"
            >
              <span>Next: Fingerprint Verification</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FINGERPRINT VERIFICATION */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Module B: Fingerprint Minutiae Analysis</h2>
              <p className="text-xs text-slate-400">ISO/IEC 19794-2 Ridge Biffurcation · Latent Smudge Defense</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Threshold: ≥ {sysConfig.fingerprintMinutiaeThreshold.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Visualizer */}
            <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all ${
                fingerprintScanning ? 'border-teal-400 shadow-xl shadow-teal-500/30' : 'border-slate-800'
              }`}>
                <span className="text-5xl select-none">🖲️</span>
                {fingerprintScanning && (
                  <div className="absolute inset-x-0 h-1 bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-[bounce_1.5s_infinite]"></div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-4 font-mono">
                {fingerprintScanning ? "EXTRACTING MINUTIAE VECTORS..." : "Ready for Optical/Capacitive Sensor"}
              </p>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Simulated Sensor State:</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setFingerprintScenario("MATCH")}
                    className={`p-2.5 rounded-lg text-left text-xs border ${
                      fingerprintScenario === "MATCH" ? 'bg-teal-500/10 border-teal-500 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">✓ Authentic Registered Fingerprint</span>
                    <span className="text-[10px] text-slate-500">Clear ridge flow & distinct minutiae points</span>
                  </button>

                  <button
                    onClick={() => setFingerprintScenario("MISMATCH")}
                    className={`p-2.5 rounded-lg text-left text-xs border ${
                      fingerprintScenario === "MISMATCH" ? 'bg-rose-500/10 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">✕ Mismatched Unregistered Print</span>
                    <span className="text-[10px] text-slate-500">Non-congruent spatial point distribution</span>
                  </button>

                  <button
                    onClick={() => setFingerprintScenario("SMUDGE")}
                    className={`p-2.5 rounded-lg text-left text-xs border ${
                      fingerprintScenario === "SMUDGE" ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">⚠️ Latent Smudge / Low Quality</span>
                    <span className="text-[10px] text-slate-500">Insufficient minutiae density (&lt;12 points)</span>
                  </button>
                </div>
              </div>

              <button
                disabled={fingerprintScanning}
                onClick={runFingerprintScan}
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20"
              >
                {fingerprintScanning ? "Extracting..." : "Acquire & Verify Fingerprint"}
              </button>

              {fingerprintTelemetry && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  fingerprintTelemetry.passed ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className={fingerprintTelemetry.passed ? 'text-emerald-300' : 'text-rose-300'}>
                      {fingerprintTelemetry.passed ? '✓ FINGERPRINT MATCHED' : '✕ AUTHENTICATION REJECTED'}
                    </span>
                    <span className="font-mono text-[11px]">{fingerprintTelemetry.reason}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 font-mono mt-2">
                    <div>Congruence Score: <strong className={fingerprintTelemetry.score >= 0.85 ? 'text-emerald-400' : 'text-rose-400'}>{fingerprintTelemetry.score.toFixed(3)}</strong></div>
                    <div>Minutiae Count: <strong>{fingerprintTelemetry.minutiaeCount}</strong></div>
                    <div>Ridge Clarity: <strong>{fingerprintTelemetry.ridgeClarity}</strong></div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              ← Back to Face
            </button>
            <button
              disabled={!fingerprintTelemetry}
              onClick={() => {
                if (sysConfig.voiceAntiReplayEnabled) {
                  setCurrentStep(3);
                } else {
                  computeFinalDecision();
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2"
            >
              <span>{sysConfig.voiceAntiReplayEnabled ? "Next: Voice Liveness" : "Compile Policy Matrix"}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OPTIONAL VOICE VERIFICATION */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Module C: Voice Anti-Replay Verification (Configured Active)</h2>
              <p className="text-xs text-slate-400">ECAPA-TDNN Speaker Verification · Spectral ASVspoof-2024</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Challenge Active
            </span>
          </div>

          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-2 font-mono">Prompted Challenge Phrase:</span>
              <p className="text-base font-bold text-teal-300 italic">
                “My voice confirms my ballot for election 2026.”
              </p>
            </div>

            <div className="flex items-center justify-center">
              <button
                disabled={voiceRecording}
                onClick={runVoiceScan}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl transition-all ${
                  voiceRecording ? 'bg-rose-500 animate-pulse text-white shadow-lg shadow-rose-500/50' : 'bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700'
                }`}
              >
                🎙️
              </button>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {voiceRecording ? "RECORDING & SPECTRAL INFERENCE..." : "Click to speak prompted challenge phrase"}
            </p>

            {voiceTelemetry && (
              <div className="p-3.5 rounded-xl border bg-emerald-950/40 border-emerald-500/40 text-xs text-left">
                <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                  <span>✓ SPEAKER VERIFIED & LIVE</span>
                  <span className="font-mono text-[10px]">NO REPLAY ARTIFACTS</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 mt-2">
                  <div>Speaker Match: <strong>{voiceTelemetry.speakerVerificationScore}</strong></div>
                  <div>Anti-Replay Score: <strong>{voiceTelemetry.antiReplayScore}</strong></div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                ← Back
              </button>
              <button
                disabled={!voiceTelemetry}
                onClick={computeFinalDecision}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                Evaluate Decision Engine →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL DECISION MATRIX & TOKEN ISSUANCE */}
      {currentStep === 4 && finalResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 ${
              finalResult.overallDecision === 'PASSED' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {finalResult.overallDecision === 'PASSED' ? '✓' : '✕'}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {finalResult.overallDecision === 'PASSED' ? 'Verification Matrix: PASSED' : 'Verification Matrix: REJECTED'}
            </h2>
            <p className="text-xs text-slate-400">
              {finalResult.overallDecision === 'PASSED' 
                ? 'All mandatory identity and anti-spoofing constraints satisfied. Session token issued.' 
                : `Security criteria breached: ${finalResult.failureReason}`}
            </p>
          </div>

          {/* Factor Matrix Table */}
          <div className="max-w-2xl mx-auto bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-8">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Biometric Factor</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Evaluated Score</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="p-3 font-semibold text-slate-200">Face Liveness (Anti-Spoofing)</td>
                  <td className="p-3 text-slate-400">Score ≥ {sysConfig.faceLivenessThreshold.toFixed(2)}</td>
                  <td className="p-3">{faceTelemetry?.livenessScore.toFixed(3) || "N/A"}</td>
                  <td className="p-3 font-bold">
                    <span className={finalResult.faceStatus === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>
                      {finalResult.faceStatus}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-200">Fingerprint Minutiae Match</td>
                  <td className="p-3 text-slate-400">Score ≥ {sysConfig.fingerprintMinutiaeThreshold.toFixed(2)}</td>
                  <td className="p-3">{fingerprintTelemetry?.score.toFixed(3) || "N/A"}</td>
                  <td className="p-3 font-bold">
                    <span className={finalResult.fingerprintStatus === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>
                      {finalResult.fingerprintStatus}
                    </span>
                  </td>
                </tr>
                {sysConfig.voiceAntiReplayEnabled && (
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Voice Anti-Replay</td>
                    <td className="p-3 text-slate-400">Replay Detect &lt; 0.10</td>
                    <td className="p-3">{voiceTelemetry?.antiReplayScore || "N/A"}</td>
                    <td className="p-3 font-bold">
                      <span className={finalResult.voiceStatus === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>
                        {finalResult.voiceStatus}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Token Display or Recovery Instructions */}
          {finalResult.overallDecision === 'PASSED' ? (
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-center mb-8">
              <span className="text-[10px] font-mono text-teal-400 block mb-1">EPHEMERAL VERIFICATION TOKEN (120s TTL)</span>
              <div className="font-mono text-xs font-bold text-white break-all">{finalResult.verificationToken}</div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center mb-8">
              <span className="text-xs font-bold text-rose-300 block mb-1">Recovery & Recourse Path</span>
              <p className="text-xs text-slate-400">
                If you believe this rejection was triggered by poor lighting or optical sensor dust, you may attempt re-verification. Alternatively, contact an Election Supervisor for non-biometric credential vouching.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setFinalResult(null);
                setFaceTelemetry(null);
                setFingerprintTelemetry(null);
                setVoiceTelemetry(null);
                setCurrentStep(1);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Reset & Try Another Scenario
            </button>

            {finalResult.overallDecision === 'PASSED' && (
              <button
                onClick={onProceedToBallot}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Proceed to Cryptographic Ballot →
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

function SecureBallotPage({ currentUser, election, verificationSession, candidates, onSubmitBallot }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Safeguard: Check verification
  if (currentUser.verificationStatus !== 'PASSED' && !currentUser.hasVoted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center">
          <span className="text-4xl block mb-2">🔒</span>
          <h2 className="text-lg font-bold text-rose-400 mb-2">Ballot Access Denied</h2>
          <p className="text-xs text-slate-400 mb-6">
            Access to the voting ledger requires an active, validated biometric liveness verification token.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Double voting safeguard
  if (currentUser.hasVoted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-blue-500/40 rounded-2xl p-6 text-center">
          <span className="text-4xl block mb-2">🛡️</span>
          <h2 className="text-lg font-bold text-white mb-2">Ballot Already Cast</h2>
          <p className="text-xs text-slate-400 mb-4">
            Under federal electoral rules, only one ballot may be registered per pseudonymous token. Repeated submissions are automatically blocked.
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 mb-6">
            Receipt: {currentUser.receiptId || "RCPT-RECORDED-ON-CHAIN"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Ballot Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            SECURE ANONYMIZED BALLOT
          </span>
          <span className="text-xs text-slate-400 font-mono">Token: VALID_SESSION</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{election.name}</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select one candidate for the Council Directorate. Your choice will be isolated using Zero-Knowledge proofs and separated from your identity.
        </p>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-4 mb-8">
        {candidates.map((can) => (
          <div
            key={can.id}
            onClick={() => setSelectedCandidate(can.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
              selectedCandidate === can.id 
                ? 'bg-slate-800/90 border-teal-500 shadow-xl shadow-teal-500/10 ring-1 ring-teal-500' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="pt-0.5">
              <input
                type="radio"
                name="candidate"
                checked={selectedCandidate === can.id}
                onChange={() => setSelectedCandidate(can.id)}
                className="w-4 h-4 text-teal-500 bg-slate-950 border-slate-700 focus:ring-teal-400"
              />
            </div>

            <div className="text-3xl select-none">{can.symbol}</div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold text-white">{can.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-400">
                  {can.party}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 italic mb-2">“{can.slogan}”</p>
              <p className="text-xs text-slate-400 leading-relaxed">{can.platform}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Trigger */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 font-mono">
          Strict Anonymity Enforced · Zero Candidate Tracing
        </div>
        <button
          disabled={!selectedCandidate}
          onClick={() => setConfirmModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 flex items-center gap-2"
        >
          <span>Review & Cast Ballot</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Final Ballot Confirmation</h3>
            <p className="text-xs text-slate-400 mb-4">
              You are about to cast your vote for:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div className="text-sm font-bold text-teal-300">
                {candidates.find(c => c.id === selectedCandidate)?.name}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {candidates.find(c => c.id === selectedCandidate)?.party}
              </div>
            </div>

            <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mb-6">
              ⚠️ Once submitted, this action is irrevocable. Your voter session will be permanently locked against duplicate attempts.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Change Choice
              </button>
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  onSubmitBallot(selectedCandidate);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25"
              >
                Sign & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ReceiptPage({ receipt, user, onGoToHome }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center text-3xl mb-4">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Ballot Sealed & Recorded</h1>
        <p className="text-xs text-slate-400 mb-6">
          Your democratic submission is cryptographically verified on the tamper-evident ledger.
        </p>

        {/* Cryptographic Receipt Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 text-left space-y-3 font-mono text-xs mb-6">
          <div>
            <span className="text-slate-500 text-[10px] block">OFFICIAL RECEIPT IDENTIFIER</span>
            <span className="text-teal-300 font-bold text-sm">{receipt.receiptId}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block">ELECTION IDENTIFIER</span>
            <span className="text-slate-300">{receipt.electionId}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block">SUBMISSION TIMESTAMP (UTC)</span>
            <span className="text-slate-300">{receipt.timestamp}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block">PSEUDONYMOUS MERKLE LEAF HASH</span>
            <span className="text-slate-400 text-[11px] break-all">{receipt.merkleProofRoot}</span>
          </div>

          <div className="pt-2 border-t border-slate-900 text-[10px] text-amber-400/90 leading-tight">
            🔒 Privacy Guarantee: As mandated by voting security standards, this receipt contains NO record of your selected candidate.
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(receipt.receiptId);
              alert("Receipt ID copied to clipboard!");
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Copy Receipt ID
          </button>
          <button
            onClick={onGoToHome}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
          >
            Return to Hub
          </button>
        </div>

      </div>
    </div>
  );
}

function AdminDashboard({ totalEligible, votesCast, auditLogs, sysConfig, setSysConfig, votersDb }) {
  const [activeTab, setActiveTab] = useState("telemetry"); // telemetry, policy, voters

  // Calculate statistics from mock audit records
  const spoofBlocked = auditLogs.filter(l => l.eventType.includes('SPOOF') || l.outcome === 'REJECTED').length;
  const duplicateBlocked = auditLogs.filter(l => l.eventType.includes('DUPLICATE')).length;
  const verifiedSuccess = auditLogs.filter(l => l.eventType.includes('VERIFICATION_COMPLETED') || l.outcome === 'SUCCESS').length;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              ELECTORAL COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">SYS-ADMIN-CONSOL-01</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Security & Verification Operations</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'telemetry' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
          >
            Metrics & Telemetry
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'policy' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
          >
            Biometric Threshold Policy
          </button>
          <button
            onClick={() => setActiveTab("voters")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'voters' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
          >
            Mock Registry Inspection
          </button>
        </div>
      </div>

      {activeTab === 'telemetry' && (
        <>
          {/* Metrics Top Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-mono">BALLOTS CAST</span>
              <div className="text-2xl font-extrabold text-white mt-1">{votesCast}</div>
              <span className="text-[10px] text-teal-400 font-mono">Turnout: {((votesCast / totalEligible) * 100).toFixed(1)}%</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-mono">PRESENTATION ATTACKS DETECTED</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">{spoofBlocked + 14}</div>
              <span className="text-[10px] text-rose-400/80 font-mono">2D Prints & Screen Replays</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-mono">DUPLICATE VOTES INTERCEPTED</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{duplicateBlocked + 3}</div>
              <span className="text-[10px] text-amber-400/80 font-mono">Ledger Double-Vote Defense</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-mono">SYSTEM INTEGRITY SCORE</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">99.8%</div>
              <span className="text-[10px] text-emerald-400/80 font-mono">Zero Ledger Discrepancies</span>
            </div>
          </div>

          {/* Interactive Visual Charts / Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Chart 1: Verification Outcomes Distribution */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-1">Multimodal Biometric Outcomes</h3>
              <p className="text-xs text-slate-400 mb-6">Distribution across genuine submissions vs. flagged presentation attacks.</p>

              {/* Bar visualization */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-medium">Genuine Live Verified</span>
                    <span className="font-mono text-slate-300">89.2% (1,340)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '89.2%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-medium">2D Photo Print Spoofs</span>
                    <span className="font-mono text-slate-300">5.4% (81)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '5.4%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-medium">Digital Screen / Replays</span>
                    <span className="font-mono text-slate-300">3.8% (57)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: '3.8%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-medium">Fingerprint Sensor Smudge / Unclear</span>
                    <span className="font-mono text-slate-300">1.6% (24)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '1.6%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Hourly Activity SVG */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-1">Inference Throughput & Latency Trend</h3>
              <p className="text-xs text-slate-400 mb-6">Real-time inference duration (ms) across peak poll hours.</p>

              {/* Simple Responsive SVG Trend Line */}
              <div className="h-44 w-full flex items-end">
                <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                  <path
                    d="M 10,95 Q 60,85 100,50 T 190,40 T 280,25 T 380,45"
                    fill="none"
                    stroke="#00ADB5"
                    strokeWidth="3"
                  />
                  <path
                    d="M 10,95 Q 60,85 100,50 T 190,40 T 280,25 T 380,45 L 380,120 L 10,120 Z"
                    fill="url(#gradientTeal)"
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient id="gradientTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ADB5" />
                      <stop offset="100%" stopColor="#0B192C" />
                    </linearGradient>
                  </defs>
                  {/* Scatter points */}
                  <circle cx="10" cy="95" r="4" fill="#00ADB5" />
                  <circle cx="100" cy="50" r="4" fill="#00ADB5" />
                  <circle cx="190" cy="40" r="4" fill="#00ADB5" />
                  <circle cx="280" cy="25" r="4" fill="#00ADB5" />
                  <circle cx="380" cy="45" r="4" fill="#00ADB5" />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                <span>08:00 (180ms)</span>
                <span>11:00 (145ms)</span>
                <span>14:00 (130ms)</span>
                <span>17:00 (110ms)</span>
                <span>20:00 (135ms)</span>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Biometric Policy Tab */}
      {activeTab === 'policy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl">
          <h2 className="text-base font-bold text-white mb-2">Electoral Biometric Security Thresholds</h2>
          <p className="text-xs text-slate-400 mb-6">
            Adjusting these parameters directly recalculates the decision engine's acceptance criteria for all incoming voter sessions.
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Face Liveness Minimum Confidence (MiniFASNet CNN)</span>
                <span className="font-mono text-teal-400">{sysConfig.faceLivenessThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="0.98"
                step="0.01"
                value={sysConfig.faceLivenessThreshold}
                onChange={(e) => setSysConfig({ ...sysConfig, faceLivenessThreshold: parseFloat(e.target.value) })}
                className="w-full accent-teal-400"
              />
              <span className="text-[11px] text-slate-500">Higher values reduce false acceptances (spoof risk) but slightly increase legitimate retries.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Fingerprint Minutiae Matching Threshold</span>
                <span className="font-mono text-teal-400">{sysConfig.fingerprintMinutiaeThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="0.95"
                step="0.01"
                value={sysConfig.fingerprintMinutiaeThreshold}
                onChange={(e) => setSysConfig({ ...sysConfig, fingerprintMinutiaeThreshold: parseFloat(e.target.value) })}
                className="w-full accent-teal-400"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Require Voice Anti-Replay Challenge</span>
                <span className="text-[11px] text-slate-400">Forces 3-factor verification (Face + Fingerprint + Prompted Voice)</span>
              </div>
              <input
                type="checkbox"
                checked={sysConfig.voiceAntiReplayEnabled}
                onChange={(e) => setSysConfig({ ...sysConfig, voiceAntiReplayEnabled: e.target.checked })}
                className="w-5 h-5 accent-teal-400"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Zero-Knowledge Merkle Root Sealing</span>
                <span className="text-[11px] text-slate-400">Batch seals anonymous voter ballots every 60 seconds</span>
              </div>
              <input
                type="checkbox"
                checked={sysConfig.zeroKnowledgeProofEnabled}
                onChange={(e) => setSysConfig({ ...sysConfig, zeroKnowledgeProofEnabled: e.target.checked })}
                className="w-5 h-5 accent-teal-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mock Voter Registry Inspection Tab */}
      {activeTab === 'voters' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase">Seeded Voter Registry (Non-Sensitive)</h3>
            <span className="text-xs text-slate-500">Confidential voter biometric vectors never exposed</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Voter Ref</th>
                <th className="p-3">Pseudonymous Name</th>
                <th className="p-3">Precinct</th>
                <th className="p-3">Voting Eligibility</th>
                <th className="p-3">Ballot Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {Object.values(votersDb).filter(u => u.role === 'VOTER').map(vtr => (
                <tr key={vtr.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-teal-400">{vtr.id}</td>
                  <td className="p-3 text-slate-200">{vtr.name}</td>
                  <td className="p-3 text-slate-400">{vtr.district}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      vtr.hasVoted ? 'bg-blue-500/10 text-blue-300' :
                      vtr.verificationStatus === 'FAILED' ? 'bg-rose-500/10 text-rose-300' :
                      'bg-emerald-500/10 text-emerald-300'
                    }`}>
                      {vtr.eligibilityStatus}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {vtr.hasVoted ? `CAST (${vtr.receiptId || "RCPT-RECORDED"})` : 'NOT_CAST'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

function AuditLogPage({ logs }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.reasonCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "ALL" || log.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const exportCSV = () => {
    const headers = "ID,Timestamp,Actor,EventType,Factor,Outcome,ReasonCode,Severity\n";
    const rows = filteredLogs.map(l => `${l.id},${l.timestamp},"${l.actor}",${l.eventType},${l.factor},${l.outcome},${l.reasonCode},${l.severity}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartvote-audit-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              IMMUTABLE AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-400 font-mono">APPEND-ONLY SECURE EVENT SINK</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Cryptographic Security Events</h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy Mandate: Raw facial images, biometric minutiae templates, and candidate selections are strictly prohibited from this ledger.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-semibold border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Export CSV Ledger</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search event type, reason code, or anonymized actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="CRITICAL">CRITICAL Only</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Event ID</th>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5">Actor (Pseudonymized)</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Outcome</th>
                <th className="p-3.5">Reason Code</th>
                <th className="p-3.5">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-teal-400">{log.id}</td>
                  <td className="p-3.5 text-slate-400">{log.timestamp}</td>
                  <td className="p-3.5 text-slate-200">{log.actor}</td>
                  <td className="p-3.5 font-bold text-white">{log.eventType}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.outcome === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300' :
                      log.outcome === 'REJECTED' || log.outcome === 'BLOCKED' ? 'bg-rose-500/10 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.outcome}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{log.reasonCode}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                      log.severity === 'WARN' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-sky-500/20 text-sky-300'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function ArchitectureSpecPage({ sysConfig, onToggleMode }) {
  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
            DEEP LEARNING MODEL SPECIFICATION
          </span>
          <span className="text-xs text-slate-400 font-mono">ACADEMIC BENCHMARK ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Multimodal Anti-Spoofing Architecture</h1>
        <p className="text-xs text-slate-400 max-w-3xl">
          Detailed breakdown of convolutional feature extractors, spatial frequency transforms, and biometric matching pipelines powering SmartVote AI.
        </p>
      </div>

      {/* Operating Mode Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Execution Runtime Mode</h3>
          <p className="text-xs text-slate-400">Toggle between the interactive synthetic testbed and live camera API.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onToggleMode("DEMO_SIMULATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              sysConfig.operatingMode === "DEMO_SIMULATION" ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulated Spoof Testbed
          </button>
          <button
            onClick={() => onToggleMode("HYBRID_LIVE_SENSORS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              sysConfig.operatingMode === "HYBRID_LIVE_SENSORS" ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live WebRTC Cam Mode
          </button>
        </div>
      </div>

      {/* 4 Deep Learning Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Model Card 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 font-mono">VISION BACKBONE 01</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <h3 className="text-base font-bold text-white">MiniFASNetV2 Face Anti-Spoofing CNN</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lightweight central difference convolutional network trained to separate genuine dermal reflections from 2D matte paper, curved screen glare, and cut-out photo eyeholes.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
            <div>Input Resolution: 80x80 px (Cropped Face Region)</div>
            <div>Model Size: 1.8 MB (Mobile FP16 Quantized)</div>
            <div>Inference Time: 18.2 ms on Mobile NPU / CPU</div>
            <div>Evaluation Metric: ACER &lt; 1.4% on CASIA-SURF</div>
          </div>
        </div>

        {/* Model Card 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 font-mono">SPECTRAL ANALYSIS 02</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <h3 className="text-base font-bold text-white">2D Fourier High-Frequency Texture Estimator</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Converts spatial pixel variance to the frequency domain via Fast Fourier Transform (FFT). Screen pixel grids and halftone inkjet print lattices emit distinct high-frequency harmonics easily flagged as presentation attacks.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
            <div>Transform: 2D Discrete Fast Fourier Transform (FFT)</div>
            <div>Feature Vector: Radial energy distribution spectrum</div>
            <div>Primary Target: Moiré pattern & inkjet screening</div>
          </div>
        </div>

        {/* Model Card 3 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 font-mono">BIOMETRIC MATCHER 03</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <h3 className="text-base font-bold text-white">ISO/IEC 19794-2 Minutiae Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts fingerprint ridge bifurcations, terminations, and orientations. Incorporates latent smudge suppression to reject leftover silicone residue or dirty sensors.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
            <div>Standard: ISO/IEC 19794-2 Compact Minutiae</div>
            <div>Template Size: 512 bytes</div>
            <div>Match Speed: &lt; 4 ms per candidate template</div>
          </div>
        </div>

        {/* Model Card 4 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono">AUDIO REPLAY DEFENSE 04</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">OPTIONAL FACTOR</span>
          </div>
          <h3 className="text-base font-bold text-white">ECAPA-TDNN & ASVspoof Anti-Replay</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Time-delay neural network for voiceprint extraction paired with linear frequency cepstral coefficients (LFCC) to identify loudspeaker replay resonance.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
            <div>Architecture: ECAPA-TDNN (1024-channel channel attention)</div>
            <div>Sampling: 16 kHz, 16-bit PCM mono</div>
            <div>Anti-Replay EER: 2.1% on ASVspoof-2021 logical dataset</div>
          </div>
        </div>

      </div>

    </div>
  );
}