import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export interface CARDeductible {
  label: string
  amount: string
}

export interface WarrantyOverride {
  contractor: string
  component: string
  duration: number
  notes: string
}

export interface WTGComponent {
  component: string
  legClause: 'LEG2' | 'LEG3'
  sublimit: string | null
}

export interface Contractor {
  id: string
  name: string
  scope: string[]
  contractType: 'EPCI' | 'Supply' | 'T&I'
  extendedMaintenance: boolean | null
  extendedMaintenanceDuration: number | null
  warrantyMaintenance: boolean | null
  warrantyMaintenanceDuration: number | null
  takeOverDate: string | null
  legClause: 'LEG1' | 'LEG2' | 'LEG3' | null
  leg2Sublimit: string | null
  wtgComponents: WTGComponent[]
  employerCoInsuredHM: boolean | null
  employerCoInsuredPI: boolean | null
  waiverSubrogationHM: boolean | null
  waiverSubrogationPI: boolean | null
  liabilityType: 'negligence' | 'knock_for_knock' | null
  liabilityExclusions: string | null
  maximumLiability: string | null
}

export interface WindFarm {
  id: string
  name: string
  phase: 'construction' | 'operation' | null
  step: number
  createdAt: Timestamp | null
  updatedAt: Timestamp | null

  // Operation fields
  operationStartYear: number | null
  insurancePropertyDamage: boolean | null
  insuranceBI: boolean | null
  deductiblePD: string | null
  deductibleBI: number | null
  warrantyYears: number
  warrantyOverrides: WarrantyOverride[]
  serviceContractType: 'full_service' | 'break_fix' | null

  // Construction fields
  insuranceCAR: boolean | null
  insuranceDSU: boolean | null
  carDeductibles: CARDeductible[]
  dsuDeductibleDays: number | null
  contractors: Contractor[]
  constructionWarrantyYears: number
  constructionWarrantyOverrides: WarrantyOverride[]
}

const WINDFARM_DEFAULTS: Omit<WindFarm, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
  phase: null,
  step: 0,
  operationStartYear: null,
  insurancePropertyDamage: null,
  insuranceBI: null,
  deductiblePD: null,
  deductibleBI: null,
  warrantyYears: 5,
  warrantyOverrides: [],
  serviceContractType: null,
  insuranceCAR: null,
  insuranceDSU: null,
  carDeductibles: [],
  dsuDeductibleDays: null,
  contractors: [],
  constructionWarrantyYears: 5,
  constructionWarrantyOverrides: [],
}

function windfarmsRef(userId: string, clientId: string) {
  return collection(db, 'users', userId, 'clients', clientId, 'windfarms')
}

function windfarmDocRef(userId: string, clientId: string, windfarmId: string) {
  return doc(db, 'users', userId, 'clients', clientId, 'windfarms', windfarmId)
}

export async function createWindFarm(
  userId: string,
  clientId: string,
  name: string,
): Promise<string> {
  const docRef = await addDoc(windfarmsRef(userId, clientId), {
    name,
    ...WINDFARM_DEFAULTS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getWindFarms(userId: string, clientId: string): Promise<WindFarm[]> {
  const q = query(windfarmsRef(userId, clientId), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as WindFarm[]
}

export async function getWindFarm(
  userId: string,
  clientId: string,
  windfarmId: string,
): Promise<WindFarm | null> {
  const snap = await getDoc(windfarmDocRef(userId, clientId, windfarmId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as WindFarm
}

export async function updateWindFarm(
  userId: string,
  clientId: string,
  windfarmId: string,
  data: Partial<Omit<WindFarm, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await updateDoc(windfarmDocRef(userId, clientId, windfarmId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWindFarm(
  userId: string,
  clientId: string,
  windfarmId: string,
): Promise<void> {
  await deleteDoc(windfarmDocRef(userId, clientId, windfarmId))
}
