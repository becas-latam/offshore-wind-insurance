const API_URL = "http://localhost:5050"

export interface ContractData {
  partyA: string
  partyB: string
  role: "owner" | "maintenance"
  scopeOfWork: string
  isServiceContract: boolean
  vesselInvolvement: "vessel" | "charter" | "none"
  liabilityType: "negligence" | "knock_for_knock"
  exclusions: string
  consequentialLosses: string
}

export interface Stakeholder {
  name: string
  description: string
}

export interface SelectedStakeholder {
  name: string
  liability: string
}

export interface RiskExposure {
  area: string
  severity: "High" | "Medium" | "Low"
  detail: string
}

export interface CoverageGap {
  gap: string
  impact: string
  recommendation: string
}

export interface StakeholderRisk {
  stakeholder: string
  risk_level: "High" | "Medium" | "Low"
  scenarios: string
  current_protection: string
  recommendation: string
}

export interface Recommendation {
  priority: "High" | "Medium" | "Low"
  action: string
  rationale: string
}

export interface RiskReport {
  rating: "High" | "Medium" | "Low"
  rating_rationale: string
  liability_exposure: RiskExposure[]
  coverage_gaps: CoverageGap[]
  stakeholder_risks: StakeholderRisk[]
  recommendations: Recommendation[]
  summary: string
}

export async function identifyStakeholders(
  contractData: ContractData,
): Promise<Stakeholder[]> {
  const response = await fetch(`${API_URL}/api/risk/stakeholders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contractData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to identify stakeholders")
  }

  const data = await response.json()
  return data.stakeholders
}

export async function analyzeRisk(
  contractData: ContractData,
  stakeholders: SelectedStakeholder[],
): Promise<RiskReport> {
  const response = await fetch(`${API_URL}/api/risk/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...contractData, stakeholders }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze risk")
  }

  const data = await response.json()
  return data.report
}

export interface ConstructionRiskReport {
  rating: "High" | "Medium" | "Low"
  rating_rationale: string
  insurance_assessment: {
    car_adequacy: string
    leg_exposure: string
    marine_protection: string
    dsu_assessment: string
  }
  key_risks: {
    risk: string
    severity: "High" | "Medium" | "Low"
    detail: string
    mitigation: string
  }[]
  liability_assessment: {
    regime_analysis: string
    cap_adequacy: string
    exclusion_gaps: string
  }
  recommendations: Recommendation[]
  summary: string
}

export async function analyzeConstructionRisk(
  windfarm: Record<string, unknown>,
  contractor: Record<string, unknown>,
  defaultWarrantyYears: number,
): Promise<ConstructionRiskReport> {
  const response = await fetch(`${API_URL}/api/risk/construction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ windfarm, contractor, defaultWarrantyYears }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze construction risk")
  }

  const data = await response.json()
  return data.report
}
