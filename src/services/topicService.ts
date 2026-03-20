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
import type { RAGSource } from './ragService'

export interface TopicMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: RAGSource[]
  model?: string
  timestamp: Timestamp | null
}

export interface Topic {
  id: string
  name: string
  context: string
  initialContext: string
  model: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  messages: TopicMessage[]
}

function topicsRef(userId: string) {
  return collection(db, 'users', userId, 'topics')
}

function topicDocRef(userId: string, topicId: string) {
  return doc(db, 'users', userId, 'topics', topicId)
}

export async function createTopic(
  userId: string,
  name: string,
  initialContext: string = '',
): Promise<string> {
  const docRef = await addDoc(topicsRef(userId), {
    name,
    context: initialContext,
    initialContext,
    model: 'gpt-5-mini',
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTopics(userId: string): Promise<Topic[]> {
  const q = query(topicsRef(userId), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as Topic[]
}

export async function getTopic(userId: string, topicId: string): Promise<Topic | null> {
  const snap = await getDoc(topicDocRef(userId, topicId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Topic
}

export async function updateTopicContext(
  userId: string,
  topicId: string,
  context: string,
): Promise<void> {
  await updateDoc(topicDocRef(userId, topicId), {
    context,
    updatedAt: serverTimestamp(),
  })
}

export async function renameTopic(
  userId: string,
  topicId: string,
  name: string,
): Promise<void> {
  await updateDoc(topicDocRef(userId, topicId), {
    name,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTopic(userId: string, topicId: string): Promise<void> {
  await deleteDoc(topicDocRef(userId, topicId))
}

export async function addMessage(
  userId: string,
  topicId: string,
  message: Omit<TopicMessage, 'timestamp'>,
): Promise<void> {
  const topicDoc = await getDoc(topicDocRef(userId, topicId))
  if (!topicDoc.exists()) return

  const data = topicDoc.data()
  const messages = data.messages || []
  messages.push({ ...message, timestamp: new Date().toISOString() })

  await updateDoc(topicDocRef(userId, topicId), {
    messages,
    updatedAt: serverTimestamp(),
  })
}
