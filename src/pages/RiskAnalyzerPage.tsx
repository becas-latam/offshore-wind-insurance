import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Import,
  Wind,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  identifyStakeholders,
  analyzeRisk,
  type ContractData,
  type Stakeholder,
  type SelectedStakeholder,
  type RiskReport,
} from '@/services/riskAnalyzerService'
import { getClients, type Client } from '@/services/clientStore'
import { getWindFarms, type WindFarm, type Contractor } from '@/services/windfarmStore'
import {
  createAnalysis,
  getAnalyses,
  updateAnalysis,
  deleteAnalysis,
  type RiskAnalysis,
} from '@/services/riskAnalysisStore'

const STEPS = [
  'Contract Partners',
  'Your Role',
  'Scope of Work',
  'Contract Type',
  'Liability Type',
  'Exclusions',
  'Consequential Losses',
  'Stakeholders',
  'Select Stakeholders',
  'Stakeholder Liability',
  'Risk Analysis',
]

const TOTAL_STEPS = STEPS.length

function RiskRatingBadge({ rating }: { rating: string }) {
  const config = {
    High: { className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    Medium: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
    Low: { className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  }[rating] ?? { className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Shield }

  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
      <Icon className="h-4 w-4" />
      {rating} Risk
    </span>
  )
}

function SeverityBadge({ level }: { level: string }) {
  const cls = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  }[level] ?? 'bg-gray-100 text-gray-700'

  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{level}</span>
}

export function RiskAnalyzerPage() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)

  // Saved analyses
  const [analyses, setAnalyses] = useState<RiskAnalysis[]>([])
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)

  // Form state
  const [partyA, setPartyA] = useState('')
  const [partyB, setPartyB] = useState('')
  const [role, setRole] = useState<'owner' | 'maintenance' | ''>('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [isServiceContract, setIsServiceContract] = useState<boolean | null>(null)
  const [vesselInvolvement, setVesselInvolvement] = useState<'vessel' | 'charter' | 'none' | ''>('')
  const [liabilityType, setLiabilityType] = useState<'negligence' | 'knock_for_knock' | ''>('')
  const [exclusions, setExclusions] = useState('')
  const [consequentialLosses, setConsequentialLosses] = useState('')

  // AI state
  const [suggestedStakeholders, setSuggestedStakeholders] = useState<Stakeholder[]>([])
  const [selectedStakeholderNames, setSelectedStakeholderNames] = useState<Set<string>>(new Set())
  const [stakeholderLiabilities, setStakeholderLiabilities] = useState<Record<string, string>>({})
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null)

  // Loading
  const [loadingStakeholders, setLoadingStakeholders] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState('')

  // Collapsible sections in report
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'exposure', 'gaps', 'stakeholders', 'recommendations']))

  // Import from project state
  const [showImport, setShowImport] = useState(false)
  const [importClients, setImportClients] = useState<Client[]>([])
  const [importWindfarms, setImportWindfarms] = useState<WindFarm[]>([])
  const [importContractors, setImportContractors] = useState<Contractor[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedWindfarmId, setSelectedWindfarmId] = useState<string | null>(null)
  const [loadingImport, setLoadingImport] = useState(false)

  // Load saved analyses on mount
  useEffect(() => {
    if (!user) return
    getAnalyses(user.uid).then(list => {
      setAnalyses(list)
      setLoadingList(false)
    }).catch(() => setLoadingList(false))
  }, [user])

  async function openImportPicker() {
    if (!user) return
    setShowImport(true)
    setLoadingImport(true)
    setSelectedClientId(null)
    setSelectedWindfarmId(null)
    setImportWindfarms([])
    setImportContractors([])
    const clients = await getClients(user.uid)
    setImportClients(clients)
    setLoadingImport(false)
  }

  async function selectImportClient(clientId: string) {
    if (!user) return
    setSelectedClientId(clientId)
    setSelectedWindfarmId(null)
    setImportContractors([])
    const wfs = await getWindFarms(user.uid, clientId)
    setImportWindfarms(wfs)
  }

  function selectImportWindfarm(wf: WindFarm) {
    setSelectedWindfarmId(wf.id)
    setImportContractors(wf.contractors ?? [])
  }

  async function importContractor(contractor: Contractor, wf: WindFarm, clientName: string) {
    // Pre-fill the risk analyzer with data from the wind farm + contractor
    const newPartyA = clientName
    const newPartyB = contractor.name || 'Contractor'
    const newRole: 'owner' | 'maintenance' = 'owner'
    const newScope = `${contractor.contractType} — ${contractor.scope.join(', ')}`
    const newLiability = contractor.liabilityType || ''
    const newExclusions = contractor.liabilityExclusions || ''

    // Determine vessel involvement from scope
    let vessel: 'vessel' | 'charter' | 'none' = 'none'
    if (contractor.contractType === 'T&I' || contractor.contractType === 'EPCI') {
      vessel = 'vessel' // T&I and EPCI typically involve vessels
    }

    setPartyA(newPartyA)
    setPartyB(newPartyB)
    setRole(newRole)
    setScopeOfWork(newScope)
    setIsServiceContract(wf.phase === 'operation')
    setVesselInvolvement(vessel)
    setLiabilityType(newLiability as any)
    setExclusions(newExclusions)
    setConsequentialLosses('')
    setSuggestedStakeholders([])
    setSelectedStakeholderNames(new Set())
    setStakeholderLiabilities({})
    setRiskReport(null)
    setStep(0)
    setError('')
    setShowImport(false)

    // Create a new analysis in Firestore
    if (!user) return
    const id = await createAnalysis(user.uid, `${newPartyA} / ${newPartyB}`, {
      partyA: newPartyA,
      partyB: newPartyB,
      role: newRole,
      scopeOfWork: newScope,
      isServiceContract: wf.phase === 'operation',
      vesselInvolvement: vessel,
      liabilityType: (newLiability || 'negligence') as any,
      exclusions: newExclusions,
      consequentialLosses: '',
    })
    setActiveAnalysisId(id)
    const list = await getAnalyses(user.uid)
    setAnalyses(list)
  }

  function getContractData(): ContractData {
    return {
      partyA,
      partyB,
      role: role as 'owner' | 'maintenance',
      scopeOfWork,
      isServiceContract: isServiceContract ?? true,
      vesselInvolvement: (vesselInvolvement || 'none') as ContractData['vesselInvolvement'],
      liabilityType: liabilityType as ContractData['liabilityType'],
      exclusions,
      consequentialLosses,
    }
  }

  // Save current state to Firestore
  const saveToFirestore = useCallback(async (overrides?: {
    currentStep?: number
    currentStakeholders?: Stakeholder[]
    currentSelectedNames?: Set<string>
    currentLiabilities?: Record<string, string>
    currentReport?: RiskReport | null
  }) => {
    if (!user || !activeAnalysisId) return

    const s = overrides?.currentStep ?? step
    const names = overrides?.currentSelectedNames ?? selectedStakeholderNames
    const liabs = overrides?.currentLiabilities ?? stakeholderLiabilities

    const selectedStakeholders: SelectedStakeholder[] = Array.from(names).map(name => ({
      name,
      liability: liabs[name] || '',
    }))

    await updateAnalysis(user.uid, activeAnalysisId, {
      contractData: getContractData(),
      suggestedStakeholders: overrides?.currentStakeholders ?? suggestedStakeholders,
      selectedStakeholders,
      report: overrides?.currentReport ?? riskReport,
      step: s,
      name: `${partyA || 'Party A'} / ${partyB || 'Party B'}`,
    })

    // Refresh sidebar
    const list = await getAnalyses(user.uid)
    setAnalyses(list)
  }, [user, activeAnalysisId, step, partyA, partyB, role, scopeOfWork, isServiceContract, vesselInvolvement, liabilityType, exclusions, consequentialLosses, suggestedStakeholders, selectedStakeholderNames, stakeholderLiabilities, riskReport])

  function loadAnalysis(analysis: RiskAnalysis) {
    const cd = analysis.contractData
    setPartyA(cd.partyA)
    setPartyB(cd.partyB)
    setRole(cd.role)
    setScopeOfWork(cd.scopeOfWork)
    setIsServiceContract(cd.isServiceContract)
    setVesselInvolvement(cd.vesselInvolvement)
    setLiabilityType(cd.liabilityType)
    setExclusions(cd.exclusions)
    setConsequentialLosses(cd.consequentialLosses)
    setSuggestedStakeholders(analysis.suggestedStakeholders || [])
    setSelectedStakeholderNames(new Set(analysis.selectedStakeholders?.map(s => s.name) || []))
    const liabs: Record<string, string> = {}
    for (const s of analysis.selectedStakeholders || []) {
      liabs[s.name] = s.liability
    }
    setStakeholderLiabilities(liabs)
    setRiskReport(analysis.report)
    setStep(analysis.step)
    setActiveAnalysisId(analysis.id)
    setError('')
  }

  function resetForm() {
    setStep(0)
    setPartyA('')
    setPartyB('')
    setRole('')
    setScopeOfWork('')
    setIsServiceContract(null)
    setVesselInvolvement('')
    setLiabilityType('')
    setExclusions('')
    setConsequentialLosses('')
    setSuggestedStakeholders([])
    setSelectedStakeholderNames(new Set())
    setStakeholderLiabilities({})
    setRiskReport(null)
    setActiveAnalysisId(null)
    setError('')
  }

  async function handleNewAnalysis() {
    if (!user) return
    resetForm()
    const id = await createAnalysis(user.uid, 'New Analysis', getContractData())
    setActiveAnalysisId(id)
    const list = await getAnalyses(user.uid)
    setAnalyses(list)
  }

  async function handleDeleteAnalysis(id: string) {
    if (!user) return
    await deleteAnalysis(user.uid, id)
    if (activeAnalysisId === id) resetForm()
    const list = await getAnalyses(user.uid)
    setAnalyses(list)
  }

  function toggleSection(section: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return partyA.trim() !== '' && partyB.trim() !== ''
      case 1: return role !== ''
      case 2: return scopeOfWork.trim() !== ''
      case 3: return isServiceContract !== null && vesselInvolvement !== ''
      case 4: return liabilityType !== ''
      case 5: return true
      case 6: return true
      case 7: return suggestedStakeholders.length > 0
      case 8: return selectedStakeholderNames.size > 0
      case 9: return Array.from(selectedStakeholderNames).every(name => stakeholderLiabilities[name]?.trim())
      case 10: return riskReport !== null
      default: return false
    }
  }

  async function handleNext() {
    setError('')

    // Step 7: trigger stakeholder identification
    if (step === 6) {
      const nextStep = 7
      setStep(nextStep)
      setLoadingStakeholders(true)
      try {
        const result = await identifyStakeholders(getContractData())
        setSuggestedStakeholders(result)
        await saveToFirestore({ currentStep: nextStep, currentStakeholders: result })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoadingStakeholders(false)
      }
      return
    }

    // Step 9 → 10: trigger risk analysis
    if (step === 9) {
      const nextStep = 10
      setStep(nextStep)
      setLoadingAnalysis(true)
      try {
        const stakeholders: SelectedStakeholder[] = Array.from(selectedStakeholderNames).map(name => ({
          name,
          liability: stakeholderLiabilities[name] || '',
        }))
        const report = await analyzeRisk(getContractData(), stakeholders)
        setRiskReport(report)
        await saveToFirestore({ currentStep: nextStep, currentReport: report })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoadingAnalysis(false)
      }
      return
    }

    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      await saveToFirestore({ currentStep: nextStep })
    }
  }

  async function handleBack() {
    if (step > 0) {
      const prevStep = step - 1
      setStep(prevStep)
      await saveToFirestore({ currentStep: prevStep })
    }
  }

  function toggleStakeholder(name: string) {
    setSelectedStakeholderNames(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
          selected
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
        }`}
      >
        {children}
      </button>
    )
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Party A</label>
              <Input
                placeholder="e.g. Ørsted Wind Power A/S"
                value={partyA}
                onChange={e => setPartyA(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Party B</label>
              <Input
                placeholder="e.g. Siemens Gamesa Renewable Energy"
                value={partyB}
                onChange={e => setPartyB(e.target.value)}
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionButton selected={role === 'owner'} onClick={() => setRole('owner')}>
              <div className="font-semibold">Offshore Wind Farm Owner</div>
              <div className="mt-1 text-xs text-muted-foreground">You represent the asset owner / operator</div>
            </OptionButton>
            <OptionButton selected={role === 'maintenance'} onClick={() => setRole('maintenance')}>
              <div className="font-semibold">Maintenance / Service Company</div>
              <div className="mt-1 text-xs text-muted-foreground">You represent the service provider</div>
            </OptionButton>
          </div>
        )

      case 2:
        return (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Scope of Work</label>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={4}
              placeholder="e.g. Exchange of gearbox for 5 WTGs at Windpark Alpha, including crane operations and component transport"
              value={scopeOfWork}
              onChange={e => setScopeOfWork(e.target.value)}
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Is this a Service Contract?</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionButton selected={isServiceContract === true} onClick={() => setIsServiceContract(true)}>
                  Yes — Service Contract
                </OptionButton>
                <OptionButton selected={isServiceContract === false} onClick={() => setIsServiceContract(false)}>
                  No — Other type
                </OptionButton>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Does the contract include a vessel?</label>
              <div className="grid gap-3 sm:grid-cols-3">
                <OptionButton selected={vesselInvolvement === 'vessel'} onClick={() => setVesselInvolvement('vessel')}>
                  Yes — Vessel
                </OptionButton>
                <OptionButton selected={vesselInvolvement === 'charter'} onClick={() => setVesselInvolvement('charter')}>
                  Yes — Charter
                </OptionButton>
                <OptionButton selected={vesselInvolvement === 'none'} onClick={() => setVesselInvolvement('none')}>
                  No vessel
                </OptionButton>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionButton selected={liabilityType === 'negligence'} onClick={() => setLiabilityType('negligence')}>
              <div className="font-semibold">Negligence-based</div>
              <div className="mt-1 text-xs text-muted-foreground">Liability follows fault — the negligent party bears the loss</div>
            </OptionButton>
            <OptionButton selected={liabilityType === 'knock_for_knock'} onClick={() => setLiabilityType('knock_for_knock')}>
              <div className="font-semibold">Knock for Knock</div>
              <div className="mt-1 text-xs text-muted-foreground">Each party bears its own losses regardless of fault</div>
            </OptionButton>
          </div>
        )

      case 5:
        return (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Liability Exclusions</label>
            <p className="mb-3 text-xs text-muted-foreground">What is excluded from liability under the contract? Leave empty if none.</p>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={4}
              placeholder="e.g. Wilful misconduct, gross negligence, pre-existing defects..."
              value={exclusions}
              onChange={e => setExclusions(e.target.value)}
            />
          </div>
        )

      case 6:
        return (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Consequential / Financial Losses</label>
            <p className="mb-3 text-xs text-muted-foreground">How does the contract handle consequential and financial losses?</p>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={4}
              placeholder="e.g. Both parties waive consequential losses except for IP infringement and willful misconduct..."
              value={consequentialLosses}
              onChange={e => setConsequentialLosses(e.target.value)}
            />
          </div>
        )

      case 7:
        return (
          <div>
            {loadingStakeholders ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing contract to identify stakeholders...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Based on your contract details, the following stakeholders were identified:
                </p>
                {suggestedStakeholders.map((s, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 8:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the stakeholders relevant to this contract:</p>
            {suggestedStakeholders.map((s, i) => {
              const selected = selectedStakeholderNames.has(s.name)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleStakeholder(s.name)}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs ${
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    }`}>
                      {selected && '✓'}
                    </div>
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <p className="mt-1 pl-7 text-xs text-muted-foreground">{s.description}</p>
                </button>
              )
            })}
          </div>
        )

      case 9:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe the liability arrangement for each selected stakeholder:
            </p>
            {Array.from(selectedStakeholderNames).map(name => (
              <div key={name}>
                <label className="mb-1.5 block text-sm font-medium">{name}</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  rows={2}
                  placeholder={`What is the liability arrangement with ${name}?`}
                  value={stakeholderLiabilities[name] || ''}
                  onChange={e =>
                    setStakeholderLiabilities(prev => ({ ...prev, [name]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )

      case 10:
        return (
          <div>
            {loadingAnalysis ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Running risk analysis...</p>
              </div>
            ) : riskReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Risk Assessment</h3>
                  <RiskRatingBadge rating={riskReport.rating} />
                </div>
                <p className="text-sm text-muted-foreground">{riskReport.rating_rationale}</p>

                <CollapsibleSection
                  title="Executive Summary"
                  expanded={expandedSections.has('summary')}
                  onToggle={() => toggleSection('summary')}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{riskReport.summary}</p>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Liability Exposure"
                  expanded={expandedSections.has('exposure')}
                  onToggle={() => toggleSection('exposure')}
                >
                  <div className="space-y-3">
                    {riskReport.liability_exposure.map((exp, i) => (
                      <div key={i} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{exp.area}</span>
                          <SeverityBadge level={exp.severity} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{exp.detail}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Coverage Gaps"
                  expanded={expandedSections.has('gaps')}
                  onToggle={() => toggleSection('gaps')}
                >
                  <div className="space-y-3">
                    {riskReport.coverage_gaps.map((gap, i) => (
                      <div key={i} className="rounded-lg border bg-muted/20 p-3">
                        <div className="text-sm font-medium">{gap.gap}</div>
                        <div className="mt-1 text-xs text-muted-foreground"><strong>Impact:</strong> {gap.impact}</div>
                        <div className="mt-1 text-xs text-primary"><strong>Recommendation:</strong> {gap.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Stakeholder Risks"
                  expanded={expandedSections.has('stakeholders')}
                  onToggle={() => toggleSection('stakeholders')}
                >
                  <div className="space-y-3">
                    {riskReport.stakeholder_risks.map((sr, i) => (
                      <div key={i} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{sr.stakeholder}</span>
                          <SeverityBadge level={sr.risk_level} />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground"><strong>Scenarios:</strong> {sr.scenarios}</div>
                        <div className="mt-1 text-xs text-muted-foreground"><strong>Current protection:</strong> {sr.current_protection}</div>
                        <div className="mt-1 text-xs text-primary"><strong>Recommendation:</strong> {sr.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Recommendations"
                  expanded={expandedSections.has('recommendations')}
                  onToggle={() => toggleSection('recommendations')}
                >
                  <div className="space-y-3">
                    {riskReport.recommendations.map((rec, i) => (
                      <div key={i} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{rec.action}</span>
                          <SeverityBadge level={rec.priority} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{rec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            ) : null}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Risk Analyzer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Analyze contract liability and identify risk exposure for offshore wind service contracts.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — Saved Analyses */}
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Analyses</h2>
            <Button size="icon-xs" variant="ghost" onClick={handleNewAnalysis} title="New analysis">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {loadingList ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved analyses yet. Click + to start one.</p>
          ) : (
            <div className="space-y-1.5">
              {analyses.map(a => (
                <div
                  key={a.id}
                  className={`group flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${
                    activeAnalysisId === a.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                  onClick={() => loadAnalysis(a)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-xs">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Step {(a.step ?? 0) + 1}/{TOTAL_STEPS}
                      {a.report ? ' — Done' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteAnalysis(a.id)
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-3xl">
          {!activeAnalysisId ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-16 text-center">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground mb-4">Select an existing analysis or create a new one.</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleNewAnalysis} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      New Analysis
                    </Button>
                    <Button onClick={openImportPicker} variant="outline" className="gap-1.5">
                      <Import className="h-4 w-4" />
                      Import from Project
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showImport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import from Project</CardTitle>
                    <CardDescription>Select a client, wind farm, and contractor to pre-fill the analysis.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingImport ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : importClients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No clients found. Create a client and wind farm first.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Client selection */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
                          <div className="flex flex-wrap gap-2">
                            {importClients.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => selectImportClient(c.id)}
                                className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                  selectedClientId === c.id
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                <Building2 className="h-3.5 w-3.5" />
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Wind farm selection */}
                        {selectedClientId && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wind Farm</label>
                            {importWindfarms.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No wind farms for this client.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {importWindfarms.map(wf => (
                                  <button
                                    key={wf.id}
                                    type="button"
                                    onClick={() => selectImportWindfarm(wf)}
                                    className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                      selectedWindfarmId === wf.id
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border hover:border-primary/30'
                                    }`}
                                  >
                                    <Wind className="h-3.5 w-3.5" />
                                    {wf.name}
                                    {wf.phase && <span className="text-xs text-muted-foreground capitalize">({wf.phase})</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contractor selection */}
                        {selectedWindfarmId && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contractor</label>
                            {importContractors.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No contractors in this wind farm. Set up the project first.</p>
                            ) : (
                              <div className="space-y-2">
                                {importContractors.map(c => {
                                  const wf = importWindfarms.find(w => w.id === selectedWindfarmId)!
                                  const clientName = importClients.find(cl => cl.id === selectedClientId)?.name || 'Client'
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => importContractor(c, wf, clientName)}
                                      className="w-full rounded-lg border-2 border-border p-3 text-left text-sm hover:border-primary/30 hover:bg-muted/50 transition-all"
                                    >
                                      <div className="font-medium">{c.name || 'Unnamed contractor'}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {c.contractType} — {c.scope.join(', ') || 'No scope'}
                                        {c.liabilityType && ` — ${c.liabilityType === 'knock_for_knock' ? 'K4K' : 'Negligence'}`}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Step {step + 1} of {TOTAL_STEPS}</span>
                  <span>{STEPS[step]}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[step]}</CardTitle>
                  <CardDescription>
                    {step === 0 && 'Enter the names of the contracting parties.'}
                    {step === 1 && 'Which party do you represent in this contract?'}
                    {step === 2 && 'Describe the scope of work covered by this contract.'}
                    {step === 3 && 'Confirm the contract type and vessel involvement.'}
                    {step === 4 && 'What type of liability regime applies?'}
                    {step === 5 && 'List any exclusions from liability in the contract.'}
                    {step === 6 && 'How does the contract handle consequential and financial losses?'}
                    {step === 7 && 'AI is identifying potential third-party stakeholders.'}
                    {step === 8 && 'Select which stakeholders are relevant to this contract.'}
                    {step === 9 && 'Describe the liability arrangement with each stakeholder.'}
                    {step === 10 && 'AI-generated risk analysis based on all contract details.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderStep()}

                  {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex gap-2">
                  {step === TOTAL_STEPS - 1 && riskReport ? (
                    <Button onClick={handleNewAnalysis} variant="outline">
                      New Analysis
                    </Button>
                  ) : null}

                  {step < TOTAL_STEPS - 1 && (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || loadingStakeholders || loadingAnalysis}
                      className="gap-1.5"
                    >
                      {step === 6 ? 'Identify Stakeholders' : step === 9 ? 'Run Analysis' : 'Next'}
                      {(loadingStakeholders || loadingAnalysis) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold">{title}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="border-t p-3">{children}</div>}
    </div>
  )
}
