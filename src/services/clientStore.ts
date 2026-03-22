import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export interface Client {
  id: string
  name: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function clientsRef(userId: string) {
  return collection(db, 'users', userId, 'clients')
}

function clientDocRef(userId: string, clientId: string) {
  return doc(db, 'users', userId, 'clients', clientId)
}

export async function createClient(userId: string, name: string): Promise<string> {
  const docRef = await addDoc(clientsRef(userId), {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getClients(userId: string): Promise<Client[]> {
  const q = query(clientsRef(userId), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]
}

export async function updateClient(
  userId: string,
  clientId: string,
  data: Partial<Pick<Client, 'name'>>,
): Promise<void> {
  await updateDoc(clientDocRef(userId, clientId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteClient(userId: string, clientId: string): Promise<void> {
  await deleteDoc(clientDocRef(userId, clientId))
}
