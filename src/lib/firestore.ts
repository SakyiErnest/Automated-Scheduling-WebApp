import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { BaseEntity } from '@/types';

// Generic type for Firestore operations
type FirestoreEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

// Convert Firestore document to app model
export function convertFromFirestore<T extends BaseEntity>(
  doc: QueryDocumentSnapshot<DocumentData>
): T {
  const data = doc.data();
  
  // Convert Timestamp objects to ISO strings
  const converted: Record<string, any> = {
    ...data,
    id: doc.id,
  };
  
  if (data.createdAt instanceof Timestamp) {
    converted.createdAt = data.createdAt.toDate().toISOString();
  }
  
  if (data.updatedAt instanceof Timestamp) {
    converted.updatedAt = data.updatedAt.toDate().toISOString();
  }
  
  return converted as T;
}

// Convert app model to Firestore document
export function convertToFirestore<T extends BaseEntity>(
  entity: Partial<T>
): FirestoreEntity<T> {
  const { id, createdAt, updatedAt, ...rest } = entity as any;
  return rest;
}

// Generic CRUD operations
export async function getEntity<T extends BaseEntity>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id,
      } as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
}

export async function getEntities<T extends BaseEntity>(
  collectionName: string,
  filters?: { field: string; operator: '==' | '!=' | '>' | '<' | '>=' | '<='; value: any }[]
): Promise<T[]> {
  try {
    let q = collection(db, collectionName);
    
    if (filters && filters.length > 0) {
      q = query(
        q,
        ...filters.map(filter => where(filter.field, filter.operator, filter.value))
      ) as any;
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertFromFirestore<T>(doc));
  } catch (error) {
    console.error(`Error getting ${collectionName} collection:`, error);
    throw error;
  }
}

export async function createEntity<T extends BaseEntity>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<T> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return convertFromFirestore<T>(newDoc as any);
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    throw error;
  }
}

export async function updateEntity<T extends BaseEntity>(
  collectionName: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<T> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    const updatedDoc = await getDoc(docRef);
    return convertFromFirestore<T>(updatedDoc as any);
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteEntity(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error);
    throw error;
  }
}

// Specific collection operations
export const schoolsCollection = {
  getAll: <T extends BaseEntity>(userId: string) => 
    getEntities<T>('schools', [{ field: 'userId', operator: '==', value: userId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('schools', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('schools', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('schools', id, data),
  delete: (id: string) => deleteEntity('schools', id),
};

export const teachersCollection = {
  getAll: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('teachers', [{ field: 'schoolId', operator: '==', value: schoolId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('teachers', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('teachers', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('teachers', id, data),
  delete: (id: string) => deleteEntity('teachers', id),
};

export const classesCollection = {
  getAll: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('classes', [{ field: 'schoolId', operator: '==', value: schoolId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('classes', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('classes', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('classes', id, data),
  delete: (id: string) => deleteEntity('classes', id),
};

export const subjectsCollection = {
  getAll: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('subjects', [{ field: 'schoolId', operator: '==', value: schoolId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('subjects', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('subjects', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('subjects', id, data),
  delete: (id: string) => deleteEntity('subjects', id),
};

export const roomsCollection = {
  getAll: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('rooms', [{ field: 'schoolId', operator: '==', value: schoolId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('rooms', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('rooms', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('rooms', id, data),
  delete: (id: string) => deleteEntity('rooms', id),
};

export const schedulesCollection = {
  getAll: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('schedules', [{ field: 'schoolId', operator: '==', value: schoolId }]),
  get: <T extends BaseEntity>(id: string) => getEntity<T>('schedules', id),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('schedules', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('schedules', id, data),
  delete: (id: string) => deleteEntity('schedules', id),
};

export const schoolSettingsCollection = {
  get: <T extends BaseEntity>(schoolId: string) => 
    getEntities<T>('schoolSettings', [{ field: 'schoolId', operator: '==', value: schoolId }])
      .then(settings => settings[0] || null),
  create: <T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => 
    createEntity<T>('schoolSettings', data),
  update: <T extends BaseEntity>(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => 
    updateEntity<T>('schoolSettings', id, data),
};
