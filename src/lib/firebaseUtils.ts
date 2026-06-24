import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

let isQuotaExceeded = false;
const cache = new Map<string, string>();
const receivedSnapshots = new Set<string>();

export async function syncToFirebase(collectionName: string, docId: string, data: any) {
  if (isQuotaExceeded) return;
  
  const cacheKey = `${collectionName}_${docId}`;
  
  if (!receivedSnapshots.has(cacheKey)) {
    console.warn(`[Firebase] Ignored write to ${cacheKey} because no snapshot has been received yet.`);
    return;
  }

  const dataString = JSON.stringify(data);
  if (cache.get(cacheKey) === dataString) {
    return; // Data hasn't changed, skip write
  }

  try {
    await setDoc(doc(db, collectionName, docId), { data }, { merge: true });
    cache.set(cacheKey, dataString);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted') {
      isQuotaExceeded = true;
      console.warn("Firebase Quota Exceeded. Writes are temporarily disabled.");
    }
    console.error("Error syncing to Firebase:", error);
  }
}

export function subscribeToFirebase(collectionName: string, docId: string, callback: (data: any) => void) {
  return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
    const cacheKey = `${collectionName}_${docId}`;
    receivedSnapshots.add(cacheKey);
    
    if (docSnap.exists() && docSnap.data().data) {
      const data = docSnap.data().data;
      const dataString = JSON.stringify(data);
      if (cache.get(cacheKey) === dataString) {
        return;
      }
      cache.set(cacheKey, dataString);
      callback(data);
    }
  });
}
