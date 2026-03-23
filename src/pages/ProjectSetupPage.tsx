import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Wind,
  Plus,
  Trash2,
  SkipForward,
  CheckCircle,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import {
  analyzeConstructionRisk,
  type ConstructionRiskReport,
} from '@/services/riskAnalyzerService'
import {
  getWindFarm,
  updateWindFarm,
  type Contractor,
  type CARDeductible,
  type WarrantyOverride,
  type WorkPackage,
  type FoundationType,
  type ContractSplit,
} from '@/services/windfarmStore'

// ─── Step definitions ──────────────────────────────────────────
const COMMON_STEPS = ['Wind Farm', 'Phase']

const OPERATION_STEPS = [
  ...COMMON_STEPS,
  'Year of Operations',
  'Insurance Coverage',
  'Deductibles',
  'Warranty',
  'Service Contract',
  'Summary',
]

const CONSTRUCTION_STEPS = [
  ...COMMON_STEPS,
  'Work Packages',
  'Insurance Coverage',
  'Deductibles',
  'Contractors',
  'LEG Clauses',
  'Insurance Conditions',
  'Warranty',
  'Risk Analysis',
  'Summary',
]

function getSteps(phase: string | null) {
  if (phase === 'operation') return OPERATION_STEPS
  // Default to construction (the longer flow) so the counter is stable from the start
  return CONSTRUCTION_STEPS
}

// ─── Number to words ───────────────────────────────────────────
function numberToWords(input: string): string {
  const num = parseFloat(input.replace(/[^0-9.]/g, ''))
  if (isNaN(num) || num === 0) return ''

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  const scales = ['', 'thousand', 'million', 'billion', 'trillion']

  if (num >= 1e15) return 'number too large'

  function convertGroup(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '')
  }

  const integer = Math.floor(num)
  if (integer === 0) return 'zero'

  const groups: string[] = []
  let remaining = integer
  let scaleIndex = 0

  while (remaining > 0) {
    const group = remaining % 1000
    if (group > 0) {
      groups.unshift(convertGroup(group) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : ''))
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex++
  }

  return groups.join(', ')
}

function AmountInWords({ value }: { value: string }) {
  const words = numberToWords(value)
  if (!words) return null
  return <p className="mt-0.5 text-xs text-muted-foreground italic">{words}</p>
}

// ─── Helpers ───────────────────────────────────────────────────
function newContractor(): Contractor {
  return {
    id: crypto.randomUUID(),
    name: '',
    scope: [],
    contractType: 'Supply',
    extendedMaintenance: null,
    extendedMaintenanceDuration: null,
    warrantyMaintenance: null,
    warrantyMaintenanceDuration: null,
    takeOverDate: null,
    legClause: null,
    leg2Sublimit: null,
    wtgComponents: [],
    employerCoInsuredHM: null,
    employerCoInsuredPI: null,
    waiverSubrogationHM: null,
    waiverSubrogationPI: null,
    liabilityType: null,
    liabilityExclusions: null,
    maximumLiability: null,
    deductibleBearer: null,
    manufacturerWarranty: null,
    manufacturerWarrantyScope: null,
    warrantyDuration: null,
    serialDefectClause: null,
    serialDefectTrigger: null,
    serialDefectObligation: null,
    liabilityCapCarveOuts: null,
  }
}

const SCOPES = ['WTG', 'Foundations', 'IAC', 'Transition Piece', 'Export Cable', 'Offshore Substation', 'Other']
const DEFAULT_WTG_COMPONENTS = ['Gearbox', 'Blades', 'Generator', 'Transformer', 'Main Bearing']

// ─── Option button ─────────────────────────────────────────────
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

function YesNoButtons({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <OptionButton selected={value === true} onClick={() => onChange(true)}>Yes</OptionButton>
      <OptionButton selected={value === false} onClick={() => onChange(false)}>No</OptionButton>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────
export function ProjectSetupPage() {
  const { user } = useAuth()
  const { clientId, windfarmId } = useParams<{ clientId: string; windfarmId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)

  // Wind farm name (step 0)
  const [name, setName] = useState('')
  // Phase (step 1)
  const [phase, setPhase] = useState<'construction' | 'operation' | null>(null)

  // ─── Operation fields ──────────
  const [operationStartYear, setOperationStartYear] = useState<string>('')
  const [insurancePD, setInsurancePD] = useState<boolean | null>(null)
  const [insuranceBI, setInsuranceBI] = useState<boolean | null>(null)
  const [deductiblePD, setDeductiblePD] = useState('')
  const [deductibleBIDays, setDeductibleBIDays] = useState('')
  const [warrantyYears, setWarrantyYears] = useState(5)
  const [warrantyOverrides, setWarrantyOverrides] = useState<WarrantyOverride[]>([])
  const [serviceContractType, setServiceContractType] = useState<'full_service' | 'break_fix' | null>(null)

  // ─── Work Packages ─────────────
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])

  // ─── Construction fields ───────
  const [insuranceCAR, setInsuranceCAR] = useState<boolean | null>(null)
  const [insuranceDSU, setInsuranceDSU] = useState<boolean | null>(null)
  const [carDeductibles, setCarDeductibles] = useState<CARDeductible[]>([{ label: 'Standard', amount: '' }])
  const [carPolicyLimit, setCarPolicyLimit] = useState('')
  const [dsuDeductibleDays, setDsuDeductibleDays] = useState('')
  const [dsuIndemnityPeriod, setDsuIndemnityPeriod] = useState('')
  const [dsuBasisOfRecovery, setDsuBasisOfRecovery] = useState('')
  const [serialLossClause, setSerialLossClause] = useState<boolean | null>(null)
  const [serialLossAggregation, setSerialLossAggregation] = useState<'per_root_cause' | 'per_individual_loss' | null>(null)
  const [decliningScale, setDecliningScale] = useState<boolean | null>(null)
  const [decliningScaleTiers, setDecliningScaleTiers] = useState('')
  const [decliningScalePercentages, setDecliningScalePercentages] = useState('')
  const [decliningScaleAppliesToDSU, setDecliningScaleAppliesToDSU] = useState<boolean | null>(null)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [constructionWarrantyYears, setConstructionWarrantyYears] = useState(5)
  const [constructionWarrantyOverrides, setConstructionWarrantyOverrides] = useState<WarrantyOverride[]>([])

  // Construction risk analysis
  const [contractorReports, setContractorReports] = useState<Record<string, ConstructionRiskReport>>({})
  const [analyzingContractor, setAnalyzingContractor] = useState<string | null>(null)
  const [error, setError] = useState('')

  const steps = getSteps(phase)
  const totalSteps = steps.length

  // ─── Load ──────────────────────
  useEffect(() => {
    if (!user || !clientId || !windfarmId) return
    getWindFarm(user.uid, clientId, windfarmId).then(data => {
      if (data) {
        setName(data.name)
        setPhase(data.phase)
        setStep(data.step ?? 0)
        setWorkPackages(data.workPackages ?? [])
        // Operation
        setOperationStartYear(data.operationStartYear?.toString() ?? '')
        setInsurancePD(data.insurancePropertyDamage)
        setInsuranceBI(data.insuranceBI)
        setDeductiblePD(data.deductiblePD ?? '')
        setDeductibleBIDays(data.deductibleBI?.toString() ?? '')
        setWarrantyYears(data.warrantyYears ?? 5)
        setWarrantyOverrides(data.warrantyOverrides ?? [])
        setServiceContractType(data.serviceContractType)
        // Construction
        setInsuranceCAR(data.insuranceCAR)
        setInsuranceDSU(data.insuranceDSU)
        setCarPolicyLimit(data.carPolicyLimit ?? '')
        setCarDeductibles(data.carDeductibles?.length ? data.carDeductibles : [{ label: 'Standard', amount: '' }])
        setDsuDeductibleDays(data.dsuDeductibleDays?.toString() ?? '')
        setDsuIndemnityPeriod(data.dsuIndemnityPeriod ?? '')
        setDsuBasisOfRecovery(data.dsuBasisOfRecovery ?? '')
        setSerialLossClause(data.serialLossClause)
        setSerialLossAggregation(data.serialLossAggregation)
        setDecliningScale(data.decliningScale)
        setDecliningScaleTiers(data.decliningScaleTiers ?? '')
        setDecliningScalePercentages(data.decliningScalePercentages ?? '')
        setDecliningScaleAppliesToDSU(data.decliningScaleAppliesToDSU)
        setContractors(data.contractors ?? [])
        setContractorReports((data.contractorRiskReports ?? {}) as Record<string, ConstructionRiskReport>)
        setConstructionWarrantyYears(data.constructionWarrantyYears ?? 5)
        setConstructionWarrantyOverrides(data.constructionWarrantyOverrides ?? [])
      }
      setLoading(false)
    })
  }, [user, clientId, windfarmId])

  // ─── Save ──────────────────────
  // Use a ref to always have the latest state for save-on-unmount
  const stateRef = useRef({
    name, phase, step, workPackages, operationStartYear, insurancePD, insuranceBI,
    deductiblePD, deductibleBIDays, warrantyYears, warrantyOverrides,
    serviceContractType, insuranceCAR, insuranceDSU, carPolicyLimit, carDeductibles,
    dsuDeductibleDays, dsuIndemnityPeriod, dsuBasisOfRecovery,
    serialLossClause, serialLossAggregation, decliningScale, decliningScaleTiers, decliningScalePercentages, decliningScaleAppliesToDSU,
    contractors, contractorReports, constructionWarrantyYears, constructionWarrantyOverrides,
  })
  stateRef.current = {
    name, phase, step, workPackages, operationStartYear, insurancePD, insuranceBI,
    deductiblePD, deductibleBIDays, warrantyYears, warrantyOverrides,
    serviceContractType, insuranceCAR, insuranceDSU, carPolicyLimit, carDeductibles,
    dsuDeductibleDays, dsuIndemnityPeriod, dsuBasisOfRecovery,
    serialLossClause, serialLossAggregation, decliningScale, decliningScaleTiers, decliningScalePercentages, decliningScaleAppliesToDSU,
    contractors, contractorReports, constructionWarrantyYears, constructionWarrantyOverrides,
  }

  async function saveState(overrides?: Partial<typeof stateRef.current>) {
    if (!user || !clientId || !windfarmId) return
    const s = { ...stateRef.current, ...overrides }
    await updateWindFarm(user.uid, clientId, windfarmId, {
      name: s.name,
      phase: s.phase,
      step: s.step,
      workPackages: s.workPackages,
      operationStartYear: s.operationStartYear ? parseInt(s.operationStartYear) : null,
      insurancePropertyDamage: s.insurancePD,
      insuranceBI: s.insuranceBI,
      deductiblePD: s.deductiblePD || null,
      deductibleBI: s.deductibleBIDays ? parseInt(s.deductibleBIDays) : null,
      warrantyYears: s.warrantyYears,
      warrantyOverrides: s.warrantyOverrides,
      serviceContractType: s.serviceContractType,
      insuranceCAR: s.insuranceCAR,
      insuranceDSU: s.insuranceDSU,
      carPolicyLimit: s.carPolicyLimit || null,
      carDeductibles: s.carDeductibles,
      dsuDeductibleDays: s.dsuDeductibleDays ? parseInt(s.dsuDeductibleDays) : null,
      dsuIndemnityPeriod: s.dsuIndemnityPeriod || null,
      dsuBasisOfRecovery: s.dsuBasisOfRecovery || null,
      serialLossClause: s.serialLossClause,
      serialLossAggregation: s.serialLossAggregation,
      decliningScale: s.decliningScale,
      decliningScaleTiers: s.decliningScaleTiers || null,
      decliningScalePercentages: s.decliningScalePercentages || null,
      decliningScaleAppliesToDSU: s.decliningScaleAppliesToDSU,
      contractors: s.contractors,
      contractorRiskReports: s.contractorReports,
      constructionWarrantyYears: s.constructionWarrantyYears,
      constructionWarrantyOverrides: s.constructionWarrantyOverrides,
    })
  }

  // Auto-save when leaving the page (only after data has loaded)
  const hasLoaded = useRef(false)
  useEffect(() => {
    if (!loading) hasLoaded.current = true
  }, [loading])

  useEffect(() => {
    return () => {
      if (hasLoaded.current) saveState()
    }
  }, [user, clientId, windfarmId])

  async function handleNext() {
    const next = step + 1
    setStep(next)
    await saveState({ step: next })
  }

  async function handleBack() {
    const prev = step - 1
    setStep(prev)
    await saveState({ step: prev })
  }

  async function handleSkip() {
    const next = step + 1
    setStep(next)
    await saveState({ step: next })
  }

  // ─── Contractor helpers ────────
  function addContractor() {
    setContractors(prev => [...prev, newContractor()])
  }

  function updateContractor(id: string, updates: Partial<Contractor>) {
    setContractors(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function removeContractor(id: string) {
    setContractors(prev => prev.filter(c => c.id !== id))
  }

  function toggleScope(contractorId: string, scope: string) {
    setContractors(prev => prev.map(c => {
      if (c.id !== contractorId) return c
      const has = c.scope.includes(scope)
      const newScope = has ? c.scope.filter(s => s !== scope) : [...c.scope, scope]
      // Auto-add default WTG components if WTG scope is added
      let wtgComponents = c.wtgComponents
      if (scope === 'WTG' && !has) {
        wtgComponents = DEFAULT_WTG_COMPONENTS.map(comp => ({
          component: comp,
          legClause: 'LEG3' as const,
          sublimit: null,
        }))
      }
      if (scope === 'WTG' && has) {
        wtgComponents = []
      }
      return { ...c, scope: newScope, wtgComponents }
    }))
  }

  // ─── Render steps ──────────────
  function renderStep() {
    const currentStepName = steps[step]

    switch (currentStepName) {
      case 'Wind Farm':
        return (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Wind Farm Name</label>
            <Input
              placeholder="e.g. Hornsea 3, or 'Offshore Wind Farm 1' for privacy"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )

      case 'Phase':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionButton selected={phase === 'construction'} onClick={() => setPhase('construction')}>
              <div className="font-semibold">Construction</div>
              <div className="mt-1 text-xs text-muted-foreground">Wind farm is under construction</div>
            </OptionButton>
            <OptionButton selected={phase === 'operation'} onClick={() => setPhase('operation')}>
              <div className="font-semibold">Operation</div>
              <div className="mt-1 text-xs text-muted-foreground">Wind farm is operational</div>
            </OptionButton>
          </div>
        )

      // ─── WORK PACKAGES ─────────────
      case 'Work Packages':
        return <WorkPackageStep workPackages={workPackages} onChange={setWorkPackages} />

      // ─── OPERATION ───────────────
      case 'Year of Operations':
        return (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Year Start of Operations</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 2023"
              value={operationStartYear}
              onChange={e => setOperationStartYear(e.target.value)}
            />
          </div>
        )

      case 'Insurance Coverage':
        if (phase === 'operation') {
          return (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Property Damage</label>
                <YesNoButtons value={insurancePD} onChange={setInsurancePD} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Business Interruption (BI)</label>
                <YesNoButtons value={insuranceBI} onChange={setInsuranceBI} />
              </div>
            </div>
          )
        }
        // Construction
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Assumption: Contractors and subcontractors are co-insured under the CAR policy.
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Property Damage (CAR)</label>
              <YesNoButtons value={insuranceCAR} onChange={setInsuranceCAR} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Delay in Start-Up (DSU)</label>
              <YesNoButtons value={insuranceDSU} onChange={setInsuranceDSU} />
            </div>
          </div>
        )

      case 'Deductibles':
        if (phase === 'operation') {
          return (
            <div className="space-y-4">
              {insurancePD && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Property Damage Deductible</label>
                  <Input
                    placeholder="e.g. 500000"
                    value={deductiblePD}
                    onChange={e => setDeductiblePD(e.target.value)}
                  />
                  <AmountInWords value={deductiblePD} />
                </div>
              )}
              {insuranceBI && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Business Interruption Deductible (days)</label>
                  <Input
                    inputMode="numeric"
                    placeholder="e.g. 60"
                    value={deductibleBIDays}
                    onChange={e => setDeductibleBIDays(e.target.value)}
                  />
                </div>
              )}
              {!insurancePD && !insuranceBI && (
                <p className="text-sm text-muted-foreground">No insurance coverage selected — skip this step.</p>
              )}
            </div>
          )
        }
        // Construction deductibles
        return (
          <div className="space-y-6">
            {insuranceCAR && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">CAR Policy Limit</label>
                <Input
                  placeholder="e.g. 500000000"
                  value={carPolicyLimit}
                  onChange={e => setCarPolicyLimit(e.target.value)}
                />
                <AmountInWords value={carPolicyLimit} />
              </div>
            )}
            {insuranceCAR && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Property Damage Deductibles</label>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setCarDeductibles(prev => [...prev, { label: '', amount: '' }])}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {carDeductibles.map((d, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        placeholder="Label (e.g. Standard, Nat Cat)"
                        value={d.label}
                        onChange={e => {
                          const next = [...carDeductibles]
                          next[i] = { ...next[i], label: e.target.value }
                          setCarDeductibles(next)
                        }}
                        className="flex-1"
                      />
                      <div className="flex-1">
                        <Input
                          placeholder="Amount"
                          value={d.amount}
                          onChange={e => {
                            const next = [...carDeductibles]
                            next[i] = { ...next[i], amount: e.target.value }
                            setCarDeductibles(next)
                          }}
                        />
                        <AmountInWords value={d.amount} />
                      </div>
                      {carDeductibles.length > 1 && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="mt-1.5 text-muted-foreground hover:text-destructive"
                          onClick={() => setCarDeductibles(prev => prev.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insuranceDSU && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">DSU Waiting Period (days)</label>
                  <Input
                    inputMode="numeric"
                    placeholder="e.g. 60"
                    value={dsuDeductibleDays}
                    onChange={e => setDsuDeductibleDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">DSU Indemnity Period</label>
                  <Input
                    placeholder="e.g. 24 months"
                    value={dsuIndemnityPeriod}
                    onChange={e => setDsuIndemnityPeriod(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">DSU Basis of Recovery</label>
                  <Input
                    placeholder="e.g. revenue loss, increased cost of working"
                    value={dsuBasisOfRecovery}
                    onChange={e => setDsuBasisOfRecovery(e.target.value)}
                  />
                </div>
              </div>
            )}
            {/* Serial Loss Clause (CAR policy level) */}
            {insuranceCAR && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Serial Loss Clause in CAR</label>
                  <YesNoButtons value={serialLossClause} onChange={setSerialLossClause} />
                </div>
                {serialLossClause && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aggregation Basis</label>
                      <div className="flex gap-2">
                        <OptionButton selected={serialLossAggregation === 'per_root_cause'} onClick={() => setSerialLossAggregation('per_root_cause')}>
                          <div className="font-semibold">Per root cause</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">One deductible for entire series</div>
                        </OptionButton>
                        <OptionButton selected={serialLossAggregation === 'per_individual_loss'} onClick={() => setSerialLossAggregation('per_individual_loss')}>
                          <div className="font-semibold">Per individual loss</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">Each unit triggers its own deductible</div>
                        </OptionButton>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Declining Coverage Scale</label>
                      <YesNoButtons value={decliningScale} onChange={setDecliningScale} />
                    </div>
                    {decliningScale && (
                      <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tier structure per component type</label>
                          <Input
                            placeholder="e.g. 3-3-3 or 5-5-5 (losses per tier)"
                            value={decliningScaleTiers}
                            onChange={e => setDecliningScaleTiers(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Coverage percentages per tier</label>
                          <Input
                            placeholder="e.g. 100-75-50"
                            value={decliningScalePercentages}
                            onChange={e => setDecliningScalePercentages(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Declining scale applies to DSU?</label>
                          <YesNoButtons value={decliningScaleAppliesToDSU} onChange={setDecliningScaleAppliesToDSU} />
                          <p className="text-xs text-muted-foreground mt-1">Typically no — DSU is not affected by the declining scale</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {!insuranceCAR && !insuranceDSU && (
              <p className="text-sm text-muted-foreground">No insurance coverage selected — skip this step.</p>
            )}
          </div>
        )

      case 'Warranty':
        if (phase === 'operation') {
          return (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Default Warranty Period (years)</label>
                <Input
                  inputMode="numeric"
                  value={warrantyYears}
                  onChange={e => setWarrantyYears(parseInt(e.target.value) || 5)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Standard assumption is 5 years. Set per contractor below if different.</p>
              </div>
              <WarrantyPerContractor
                contractors={contractors}
                overrides={warrantyOverrides}
                onChange={setWarrantyOverrides}
                defaultYears={warrantyYears}
              />
            </div>
          )
        }
        // Construction warranty
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Default Warranty Period (years)</label>
              <Input
                inputMode="numeric"
                value={constructionWarrantyYears}
                onChange={e => setConstructionWarrantyYears(parseInt(e.target.value) || 5)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Standard assumption is 5 years. Set per contractor below if different.</p>
            </div>
            <WarrantyPerContractor
              contractors={contractors}
              overrides={constructionWarrantyOverrides}
              onChange={setConstructionWarrantyOverrides}
              defaultYears={constructionWarrantyYears}
            />
          </div>
        )

      case 'Service Contract':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionButton selected={serviceContractType === 'full_service'} onClick={() => setServiceContractType('full_service')}>
              <div className="font-semibold">Full Service Contract</div>
              <div className="mt-1 text-xs text-muted-foreground">Service company handles all maintenance and repairs</div>
            </OptionButton>
            <OptionButton selected={serviceContractType === 'break_fix'} onClick={() => setServiceContractType('break_fix')}>
              <div className="font-semibold">Break-Fix</div>
              <div className="mt-1 text-xs text-muted-foreground">Service company exchanges components, employer pays for parts</div>
            </OptionButton>
          </div>
        )

      // ─── CONSTRUCTION ────────────
      case 'Contractors':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Add contractors and their scope of work.</p>
              <Button size="sm" variant="outline" onClick={addContractor} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Contractor
              </Button>
            </div>
            {contractors.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No contractors added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {contractors.map((c, idx) => (
                  <Card key={c.id} size="sm">
                    <CardContent className="space-y-3 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">{idx + 1}.</span>
                        <Input
                          placeholder="Contractor name"
                          value={c.name}
                          onChange={e => updateContractor(c.id, { name: e.target.value })}
                          className="flex-1"
                        />
                        <select
                          value={c.contractType}
                          onChange={e => updateContractor(c.id, { contractType: e.target.value as Contractor['contractType'] })}
                          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                        >
                          <option value="EPCI">EPCI</option>
                          <option value="Supply">Supply</option>
                          <option value="T&I">T&I</option>
                        </select>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeContractor(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Scope */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Scope</label>
                        <div className="flex flex-wrap gap-1.5">
                          {SCOPES.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleScope(c.id, s)}
                              className={`rounded-md px-2 py-1 text-xs font-medium border transition-all ${
                                c.scope.includes(s)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/30'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Maintenance */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Extended Maintenance</label>
                          <div className="flex items-center gap-2">
                            <YesNoButtons value={c.extendedMaintenance} onChange={v => updateContractor(c.id, { extendedMaintenance: v })} />
                            {c.extendedMaintenance && (
                              <Input
                                inputMode="numeric"
                                placeholder="months"
                                className="w-24"
                                value={c.extendedMaintenanceDuration ?? ''}
                                onChange={e => updateContractor(c.id, { extendedMaintenanceDuration: parseInt(e.target.value) || null })}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Warranty Maintenance</label>
                          <div className="flex items-center gap-2">
                            <YesNoButtons value={c.warrantyMaintenance} onChange={v => updateContractor(c.id, { warrantyMaintenance: v })} />
                            {c.warrantyMaintenance && (
                              <Input
                                inputMode="numeric"
                                placeholder="months"
                                className="w-24"
                                value={c.warrantyMaintenanceDuration ?? ''}
                                onChange={e => updateContractor(c.id, { warrantyMaintenanceDuration: parseInt(e.target.value) || null })}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Take Over Date */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Take Over of Works Date</label>
                        <Input
                          type="date"
                          value={c.takeOverDate ?? ''}
                          onChange={e => updateContractor(c.id, { takeOverDate: e.target.value || null })}
                          className="w-48"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case 'LEG Clauses':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign LEG defect exclusion clauses per contractor. For WTG contractors, specify per component.
            </p>
            {contractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contractors — go back and add contractors first.</p>
            ) : (
              contractors.map(c => (
                <Card key={c.id} size="sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name || 'Unnamed contractor'}</CardTitle>
                    <CardDescription className="text-xs">{c.scope.join(', ') || 'No scope'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">LEG Clause</label>
                      <div className="flex gap-2">
                        {(['LEG1', 'LEG2', 'LEG3'] as const).map(leg => (
                          <OptionButton
                            key={leg}
                            selected={c.legClause === leg}
                            onClick={() => updateContractor(c.id, { legClause: leg })}
                          >
                            {leg.replace('LEG', 'LEG ')}
                          </OptionButton>
                        ))}
                      </div>
                    </div>
                    {c.legClause === 'LEG3' && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">LEG 3 Sublimit</label>
                        <Input
                          placeholder="e.g. 10000000"
                          value={c.leg2Sublimit ?? ''}
                          onChange={e => updateContractor(c.id, { leg2Sublimit: e.target.value || null })}
                        />
                        <AmountInWords value={c.leg2Sublimit ?? ''} />
                      </div>
                    )}

                    {/* WTG component-level LEG */}
                    {c.scope.includes('WTG') && c.wtgComponents.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-muted-foreground">WTG Components</label>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              const comps = [...c.wtgComponents, { component: '', legClause: 'LEG3' as const, sublimit: null }]
                              updateContractor(c.id, { wtgComponents: comps })
                            }}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          {c.wtgComponents.map((comp, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                              <Input
                                placeholder="Component"
                                value={comp.component}
                                onChange={e => {
                                  const next = [...c.wtgComponents]
                                  next[ci] = { ...next[ci], component: e.target.value }
                                  updateContractor(c.id, { wtgComponents: next })
                                }}
                                className="flex-1"
                              />
                              <select
                                value={comp.legClause}
                                onChange={e => {
                                  const next = [...c.wtgComponents]
                                  next[ci] = { ...next[ci], legClause: e.target.value as 'LEG2' | 'LEG3' }
                                  updateContractor(c.id, { wtgComponents: next })
                                }}
                                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                              >
                                <option value="LEG2">LEG 2</option>
                                <option value="LEG3">LEG 3</option>
                              </select>
                              {comp.legClause === 'LEG3' && (
                                <Input
                                  placeholder="Sublimit"
                                  value={comp.sublimit ?? ''}
                                  onChange={e => {
                                    const next = [...c.wtgComponents]
                                    next[ci] = { ...next[ci], sublimit: e.target.value || null }
                                    updateContractor(c.id, { wtgComponents: next })
                                  }}
                                  className="w-32"
                                />
                              )}
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const next = c.wtgComponents.filter((_, j) => j !== ci)
                                  updateContractor(c.id, { wtgComponents: next })
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )

      case 'Insurance Conditions':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Insurance conditions agreed with each contractor.
            </p>
            {contractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contractors — go back and add contractors first.</p>
            ) : (
              contractors.map(c => (
                <Card key={c.id} size="sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.name || 'Unnamed contractor'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer Co-insured (H&M)</label>
                        <YesNoButtons value={c.employerCoInsuredHM} onChange={v => updateContractor(c.id, { employerCoInsuredHM: v })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer Co-insured (P&I)</label>
                        <YesNoButtons value={c.employerCoInsuredPI} onChange={v => updateContractor(c.id, { employerCoInsuredPI: v })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Waiver of Subrogation (H&M)</label>
                        <YesNoButtons value={c.waiverSubrogationHM} onChange={v => updateContractor(c.id, { waiverSubrogationHM: v })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Waiver of Subrogation (P&I)</label>
                        <YesNoButtons value={c.waiverSubrogationPI} onChange={v => updateContractor(c.id, { waiverSubrogationPI: v })} />
                      </div>
                    </div>
                    {/* Who bears the deductible */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Who Bears the CAR Deductible?</label>
                      <div className="flex gap-2">
                        {(['employer', 'contractor', 'shared'] as const).map(opt => (
                          <OptionButton key={opt} selected={c.deductibleBearer === opt} onClick={() => updateContractor(c.id, { deductibleBearer: opt })}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </OptionButton>
                        ))}
                      </div>
                    </div>

                    {/* Liability */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Liability Type</label>
                      <div className="flex gap-2">
                        <OptionButton selected={c.liabilityType === 'negligence'} onClick={() => updateContractor(c.id, { liabilityType: 'negligence' })}>Negligence</OptionButton>
                        <OptionButton selected={c.liabilityType === 'knock_for_knock'} onClick={() => updateContractor(c.id, { liabilityType: 'knock_for_knock' })}>Knock for Knock</OptionButton>
                        <OptionButton selected={c.liabilityType === 'hybrid'} onClick={() => updateContractor(c.id, { liabilityType: 'hybrid' })}>Hybrid</OptionButton>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Liability Exclusions</label>
                      <textarea
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        rows={2}
                        placeholder="Describe exclusions..."
                        value={c.liabilityExclusions ?? ''}
                        onChange={e => updateContractor(c.id, { liabilityExclusions: e.target.value || null })}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Maximum Liability</label>
                        <Input placeholder="e.g. 50000000 or 100% of contract value" value={c.maximumLiability ?? ''} onChange={e => updateContractor(c.id, { maximumLiability: e.target.value || null })} />
                        <AmountInWords value={c.maximumLiability ?? ''} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Cap Carve-outs</label>
                        <Input placeholder="e.g. gross negligence, wilful misconduct, IP" value={c.liabilityCapCarveOuts ?? ''} onChange={e => updateContractor(c.id, { liabilityCapCarveOuts: e.target.value || null })} />
                      </div>
                    </div>

                    {/* Serial Defect Clause (contractual) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Serial Defect Clause (contractual)</label>
                      <YesNoButtons value={c.serialDefectClause} onChange={v => updateContractor(c.id, { serialDefectClause: v })} />
                      {c.serialDefectClause && (
                        <div className="grid gap-2 sm:grid-cols-2 mt-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Trigger (number of same-type failures)</label>
                            <Input
                              inputMode="numeric"
                              placeholder="e.g. 3"
                              value={c.serialDefectTrigger ?? ''}
                              onChange={e => updateContractor(c.id, { serialDefectTrigger: parseInt(e.target.value) || null })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Obligation when triggered</label>
                            <select
                              value={c.serialDefectObligation ?? ''}
                              onChange={e => updateContractor(c.id, { serialDefectObligation: (e.target.value || null) as Contractor['serialDefectObligation'] })}
                              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="inspect_all">Inspect all units</option>
                              <option value="inspect_replace_all">Inspect + replace all</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )

      case 'Risk Analysis': {
        async function runAnalysis(contractorId: string) {
          const c = contractors.find(x => x.id === contractorId)
          if (!c) return
          setAnalyzingContractor(contractorId)
          setError('')
          try {
            const wfData = {
              name, phase, insuranceCAR, insuranceDSU, carPolicyLimit,
              carDeductibles, dsuDeductibleDays: dsuDeductibleDays ? parseInt(dsuDeductibleDays) : null,
              dsuIndemnityPeriod, dsuBasisOfRecovery,
              serialLossClause, serialLossAggregation, decliningScale,
              decliningScaleTiers, decliningScalePercentages, decliningScaleAppliesToDSU,
            }
            const result = await analyzeConstructionRisk(wfData, c as unknown as Record<string, unknown>, constructionWarrantyYears)
            const updated = { ...contractorReports, [contractorId]: result }
            setContractorReports(updated)
            // Save to Firestore immediately
            await saveState({ contractorReports: updated } as any)
          } catch (e: any) {
            setError(e.message)
          } finally {
            setAnalyzingContractor(null)
          }
        }

        async function deleteReport(contractorId: string) {
          const updated = { ...contractorReports }
          delete updated[contractorId]
          setContractorReports(updated)
          await saveState({ contractorReports: updated } as any)
        }

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze the risk between the Employer and each contractor based on the insurance structure, LEG clauses, and liability conditions.
            </p>
            {contractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contractors — go back and add contractors first.</p>
            ) : (
              contractors.map(c => {
                const report = contractorReports[c.id]
                const isAnalyzing = analyzingContractor === c.id
                return (
                  <Card key={c.id} size="sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">{c.name || 'Unnamed contractor'}</CardTitle>
                          <CardDescription className="text-xs">
                            {c.contractType} — {c.scope.join(', ') || 'No scope'}
                            {c.legClause && ` — ${c.legClause}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {report && <RiskBadge rating={report.rating} />}
                          {report && !isAnalyzing && (
                            <div className="flex gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                title="Re-run analysis"
                                onClick={() => runAnalysis(c.id)}
                              >
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                title="Delete analysis"
                                onClick={() => deleteReport(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2 py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Analyzing risks...</span>
                        </div>
                      ) : report ? (
                        <ConstructionReportView report={report} />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => runAnalysis(c.id)}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Analyze Risk
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )
      }

      case 'Summary':
        return <ProjectSummary phase={phase} data={{
          name, operationStartYear, insurancePD, insuranceBI, deductiblePD, deductibleBIDays,
          warrantyYears, warrantyOverrides, serviceContractType,
          insuranceCAR, insuranceDSU, carDeductibles, dsuDeductibleDays,
          contractors, constructionWarrantyYears, constructionWarrantyOverrides,
        }} />

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Wind Farms
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wind className="h-8 w-8 text-primary" />
          {name || 'Wind Farm Setup'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set up the project details, insurance structure, and contractor information.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{steps[step]}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
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
          {step > 1 && step < totalSteps - 1 && (
            <Button variant="ghost" onClick={handleSkip} className="gap-1.5 text-muted-foreground">
              Skip
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
          {step < totalSteps - 1 && (
            <Button onClick={handleNext} className="gap-1.5">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === totalSteps - 1 && (
            <Button onClick={async () => {
              await saveState()
              navigate(`/clients/${clientId}`)
            }} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Save & Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Warranty Per Contractor ───────────────────────────────────
function WarrantyPerContractor({
  contractors,
  overrides,
  onChange,
  defaultYears,
}: {
  contractors: Contractor[]
  overrides: WarrantyOverride[]
  onChange: (v: WarrantyOverride[]) => void
  defaultYears: number
}) {
  function getOverride(contractor: string, component: string) {
    return overrides.find(o => o.contractor === contractor && o.component === component)
  }

  function setOverride(contractor: string, component: string, duration: number, notes: string) {
    const existing = overrides.findIndex(o => o.contractor === contractor && o.component === component)
    if (existing >= 0) {
      const next = [...overrides]
      next[existing] = { contractor, component, duration, notes }
      onChange(next)
    } else {
      onChange([...overrides, { contractor, component, duration, notes }])
    }
  }

  function removeOverride(contractor: string, component: string) {
    onChange(overrides.filter(o => !(o.contractor === contractor && o.component === component)))
  }

  if (contractors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No contractors added yet — go back to add contractors first.</p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Default warranty is {defaultYears} years. Only fill in overrides where the warranty differs.
      </p>
      {contractors.map(c => {
        const contractorOverride = getOverride(c.name || c.id, 'all')
        const hasWTG = c.scope.includes('WTG')
        return (
          <Card key={c.id} size="sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{c.name || 'Unnamed contractor'}</CardTitle>
              <CardDescription className="text-xs">{c.scope.join(', ') || 'No scope'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overall warranty for this contractor */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Warranty (years)</label>
                <Input
                  inputMode="numeric"
                  placeholder={`${defaultYears} (default)`}
                  value={contractorOverride?.duration || ''}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    if (val && val !== defaultYears) {
                      setOverride(c.name || c.id, 'all', val, '')
                    } else {
                      removeOverride(c.name || c.id, 'all')
                    }
                  }}
                  className="w-28"
                />
                {contractorOverride && (
                  <span className="text-xs text-primary">overridden</span>
                )}
              </div>

              {/* Per-component warranty for WTG */}
              {hasWTG && c.wtgComponents.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Per WTG Component</label>
                  <div className="space-y-1.5">
                    {c.wtgComponents.map((comp, ci) => {
                      const compOverride = getOverride(c.name || c.id, comp.component)
                      return (
                        <div key={ci} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-32 truncate">{comp.component || `Component ${ci + 1}`}</span>
                          <Input
                            inputMode="numeric"
                            placeholder={`${contractorOverride?.duration || defaultYears} (default)`}
                            value={compOverride?.duration || ''}
                            onChange={e => {
                              const val = parseInt(e.target.value)
                              const effectiveDefault = contractorOverride?.duration || defaultYears
                              if (val && val !== effectiveDefault) {
                                setOverride(c.name || c.id, comp.component, val, '')
                              } else {
                                removeOverride(c.name || c.id, comp.component)
                              }
                            }}
                            className="w-28"
                          />
                          {compOverride && (
                            <span className="text-xs text-primary">overridden</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Summary Component ─────────────────────────────────────────
// ─── Work Package Step ─────────────────────────────────────────
const WP_TYPES = ['WTG', 'Foundations', 'IAC', 'Offshore Substation', 'Export Cable'] as const
const FOUNDATION_TYPES: { value: FoundationType; label: string }[] = [
  { value: 'monopile', label: 'Monopile' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'floating', label: 'Floating' },
  { value: 'gbs', label: 'GBS (Gravity-Based)' },
]
const CONTRACT_SPLITS: ContractSplit[] = ['EPCI', 'Supply', 'T&I']

function WorkPackageStep({ workPackages, onChange }: { workPackages: WorkPackage[]; onChange: (wps: WorkPackage[]) => void }) {

  function isWPActive(type: string) {
    return workPackages.some(wp => wp.type === type)
  }

  function toggleWP(type: typeof WP_TYPES[number]) {
    if (isWPActive(type)) {
      onChange(workPackages.filter(wp => wp.type !== type))
    } else {
      onChange([...workPackages, {
        id: crypto.randomUUID(),
        type,
        contractSplits: [],
        ...(type === 'Foundations' ? { foundationTypes: [], transitionPiece: null } : {}),
      }])
    }
  }

  function updateWP(type: string, updates: Partial<WorkPackage>) {
    onChange(workPackages.map(wp => wp.type === type ? { ...wp, ...updates } : wp))
  }

  function toggleContractSplit(type: string, split: ContractSplit) {
    const wp = workPackages.find(w => w.type === type)
    if (!wp) return
    const has = wp.contractSplits.includes(split)
    // EPCI is exclusive — if selecting EPCI, clear Supply/T&I. If selecting Supply or T&I, clear EPCI
    let newSplits: ContractSplit[]
    if (split === 'EPCI') {
      newSplits = has ? [] : ['EPCI']
    } else {
      newSplits = has
        ? wp.contractSplits.filter(s => s !== split)
        : [...wp.contractSplits.filter(s => s !== 'EPCI'), split]
    }
    updateWP(type, { contractSplits: newSplits })
  }

  function toggleFoundationType(ft: FoundationType) {
    const wp = workPackages.find(w => w.type === 'Foundations')
    if (!wp) return
    const types = wp.foundationTypes ?? []
    const has = types.includes(ft)
    const newTypes = has ? types.filter(t => t !== ft) : [...types, ft]
    // If removing monopile, clear transition piece fields
    const updates: Partial<WorkPackage> = { foundationTypes: newTypes }
    if (ft === 'monopile' && has) {
      updates.hasTransitionPiece = null
      updates.transitionPieceSeparateContract = null
    }
    updateWP('Foundations', updates)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the major work packages for this project and their contract structure.
      </p>

      {WP_TYPES.map(type => {
        const active = isWPActive(type)
        const wp = workPackages.find(w => w.type === type)
        return (
          <div key={type} className={`rounded-lg border-2 transition-all ${active ? 'border-primary bg-primary/5' : 'border-border'}`}>
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => toggleWP(type)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
              }`}>
                {active && '✓'}
              </div>
              <span className="text-sm font-medium">{type}</span>
            </button>

            {/* Options when active */}
            {active && wp && (
              <div className="border-t px-3 pb-3 pt-2 space-y-3">
                {/* Contract split */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contract Structure</label>
                  <div className="flex gap-2">
                    {CONTRACT_SPLITS.map(split => (
                      <button
                        key={split}
                        type="button"
                        onClick={() => toggleContractSplit(type, split)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-all ${
                          wp.contractSplits.includes(split)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {split}
                      </button>
                    ))}
                  </div>
                  {wp.contractSplits.includes('Supply') && wp.contractSplits.includes('T&I') && (
                    <p className="text-xs text-muted-foreground mt-1">Separate Supply and T&I contracts</p>
                  )}
                  {wp.contractSplits.includes('EPCI') && (
                    <p className="text-xs text-muted-foreground mt-1">Single EPCI contract covering engineering, procurement, construction & installation</p>
                  )}
                </div>

                {/* Foundations-specific: foundation type */}
                {type === 'Foundations' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Foundation Type(s)</label>
                    <div className="flex flex-wrap gap-2">
                      {FOUNDATION_TYPES.map(ft => (
                        <button
                          key={ft.value}
                          type="button"
                          onClick={() => toggleFoundationType(ft.value)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-all ${
                            (wp.foundationTypes ?? []).includes(ft.value)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {ft.label}
                        </button>
                      ))}
                    </div>

                    {/* Transition piece for monopile */}
                    {(wp.foundationTypes ?? []).includes('monopile') && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Does the monopile have a Transition Piece?</label>
                          <div className="flex gap-2">
                            <OptionButton selected={wp.hasTransitionPiece === true} onClick={() => updateWP('Foundations', { hasTransitionPiece: true })}>
                              Yes — with Transition Piece
                            </OptionButton>
                            <OptionButton selected={wp.hasTransitionPiece === false} onClick={() => updateWP('Foundations', { hasTransitionPiece: false, transitionPieceSeparateContract: null })}>
                              No — monopile only
                            </OptionButton>
                          </div>
                        </div>
                        {wp.hasTransitionPiece && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Is the Transition Piece under a separate contractor?</label>
                            <div className="flex gap-2">
                              <OptionButton selected={wp.transitionPieceSeparateContract === true} onClick={() => updateWP('Foundations', { transitionPieceSeparateContract: true })}>
                                Yes — separate TP contractor
                              </OptionButton>
                              <OptionButton selected={wp.transitionPieceSeparateContract === false} onClick={() => updateWP('Foundations', { transitionPieceSeparateContract: false })}>
                                No — same contractor as monopile
                              </OptionButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RiskBadge({ rating }: { rating: string }) {
  const config = {
    High: { className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    Medium: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
    Low: { className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  }[rating] ?? { className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Shield }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {rating}
    </span>
  )
}

function SeverityDot({ level }: { level: string }) {
  const cls = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' }[level] ?? 'bg-gray-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />
}

function ConstructionReportView({ report }: { report: ConstructionRiskReport }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground text-xs">{report.rating_rationale}</p>

      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold mb-1">Summary</h4>
        <p className="text-xs text-muted-foreground whitespace-pre-line">{report.summary}</p>
      </div>

      {/* Insurance Assessment */}
      <div>
        <h4 className="text-xs font-semibold mb-1">Insurance Assessment</h4>
        <div className="space-y-1">
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">CAR Adequacy:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.insurance_assessment.car_adequacy}</span>
          </div>
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">LEG Exposure:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.insurance_assessment.leg_exposure}</span>
          </div>
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">Marine Protection:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.insurance_assessment.marine_protection}</span>
          </div>
          {report.insurance_assessment.dsu_assessment && (
            <div className="rounded bg-muted/30 p-2">
              <span className="text-xs font-medium">DSU:</span>
              <span className="text-xs text-muted-foreground ml-1">{report.insurance_assessment.dsu_assessment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Risks */}
      <div>
        <h4 className="text-xs font-semibold mb-1">Key Risks</h4>
        <div className="space-y-1.5">
          {report.key_risks.map((r, i) => (
            <div key={i} className="rounded border bg-muted/20 p-2">
              <div className="flex items-center gap-1.5">
                <SeverityDot level={r.severity} />
                <span className="text-xs font-medium">{r.risk}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
              <p className="text-xs text-primary mt-0.5">Mitigation: {r.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Liability */}
      <div>
        <h4 className="text-xs font-semibold mb-1">Liability Assessment</h4>
        <div className="space-y-1">
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">Regime:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.liability_assessment.regime_analysis}</span>
          </div>
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">Cap Adequacy:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.liability_assessment.cap_adequacy}</span>
          </div>
          <div className="rounded bg-muted/30 p-2">
            <span className="text-xs font-medium">Exclusion Gaps:</span>
            <span className="text-xs text-muted-foreground ml-1">{report.liability_assessment.exclusion_gaps}</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-xs font-semibold mb-1">Recommendations</h4>
        <div className="space-y-1.5">
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded border bg-muted/20 p-2">
              <SeverityDot level={r.priority} />
              <div>
                <span className="text-xs font-medium">{r.action}</span>
                <p className="text-xs text-muted-foreground">{r.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectSummary({ phase, data }: { phase: string | null; data: any }) {
  function Field({ label, value, missing }: { label: string; value?: string | number | null; missing?: boolean }) {
    const isMissing = missing ?? (!value && value !== 0)
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        {isMissing ? (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertCircle className="h-3.5 w-3.5" /> Missing
          </span>
        ) : (
          <span className="text-sm font-medium">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">General</h3>
        <Field label="Wind Farm" value={data.name} />
        <Field label="Phase" value={phase} />
      </div>

      {phase === 'operation' && (
        <>
          <div>
            <h3 className="text-sm font-semibold mb-2">Insurance</h3>
            <Field label="Year of Operations" value={data.operationStartYear} />
            <Field label="Property Damage" value={data.insurancePD} missing={data.insurancePD === null} />
            <Field label="Business Interruption" value={data.insuranceBI} missing={data.insuranceBI === null} />
            <Field label="PD Deductible" value={data.deductiblePD} />
            <Field label="BI Deductible (days)" value={data.deductibleBIDays} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Service</h3>
            <Field label="Warranty (years)" value={data.warrantyYears} />
            <Field label="Service Contract" value={data.serviceContractType?.replace('_', ' ')} />
          </div>
        </>
      )}

      {phase === 'construction' && (
        <>
          <div>
            <h3 className="text-sm font-semibold mb-2">Insurance</h3>
            <Field label="CAR (Property Damage)" value={data.insuranceCAR} missing={data.insuranceCAR === null} />
            <Field label="DSU" value={data.insuranceDSU} missing={data.insuranceDSU === null} />
            <Field label="DSU Deductible (days)" value={data.dsuDeductibleDays} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Contractors ({data.contractors?.length ?? 0})</h3>
            {(data.contractors ?? []).length === 0 ? (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> No contractors added
              </p>
            ) : (
              data.contractors.map((c: any) => (
                <div key={c.id} className="rounded-lg border bg-muted/20 p-2 mb-2">
                  <div className="text-sm font-medium">{c.name || 'Unnamed'}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.contractType} — {c.scope.join(', ') || 'No scope'}
                    {c.legClause && ` — ${c.legClause}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
