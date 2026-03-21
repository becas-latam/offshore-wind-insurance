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
import type {
  ContractData,
  SelectedStakeholder,
  Stakeholder,
  RiskReport,
} from './riskAnalyzerService'

export interface RiskAnalysis {
  id: string
  name: string
  contractData: ContractData
  suggestedStakeholders: Stakeholder[]
  selectedStakeholders: SelectedStakeholder[]
  report: RiskReport | null
  step: number
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function analysesRef(userId: string) {
  return collection(db, 'users', userId, 'riskAnalyses')
}

function analysisDocRef(userId: string, analysisId: string) {
  return doc(db, 'users', userId, 'riskAnalyses', analysisId)
}

export async function createAnalysis(
  userId: string,
  name: string,
  contractData: ContractData,
): Promise<string> {
  const docRef = await addDoc(analysesRef(userId), {
    name,
    contractData,
    suggestedStakeholders: [],
    selectedStakeholders: [],
    report: null,
    step: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getAnalyses(userId: string): Promise<RiskAnalysis[]> {
  const q = query(analysesRef(userId), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as RiskAnalysis[]
}

export async function getAnalysis(
  userId: string,
  analysisId: string,
): Promise<RiskAnalysis | null> {
  const snap = await getDoc(analysisDocRef(userId, analysisId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as RiskAnalysis
}

export async function updateAnalysis(
  userId: string,
  analysisId: string,
  data: Partial<Omit<RiskAnalysis, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await updateDoc(analysisDocRef(userId, analysisId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAnalysis(
  userId: string,
  analysisId: string,
): Promise<void> {
  await deleteDoc(analysisDocRef(userId, analysisId))
}
