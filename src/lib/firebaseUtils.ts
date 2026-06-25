import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const cache = new Map<string, string>();
const receivedSnapshots = new Set<string>();

export async function syncToFirebase(collectionName: string, docId: string, data: any) {
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
    const sanitizedData = JSON.parse(dataString);
    await setDoc(doc(db, collectionName, docId), { data: sanitizedData, _lastModified: Date.now() }, { merge: true });
    cache.set(cacheKey, dataString);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted') {
      console.warn(`[Firebase] Quota exceeded. Using local writes for ${collectionName}/${docId}.`);
    } else {
      console.error(`Error syncing to Firebase ${collectionName}/${docId}:`, error);
    }
  }
}

export function subscribeToFirebase(collectionName: string, docId: string, callback: (data: any) => void) {
  return onSnapshot(
    doc(db, collectionName, docId),
    (docSnap) => {
      const cacheKey = `${collectionName}_${docId}`;
      receivedSnapshots.add(cacheKey);
      
      if (docSnap.exists() && docSnap.data().data) {
        const docData = docSnap.data();
        const data = docData.data;
        const lastMod = docData._lastModified || 0;
        
        try {
          const isLoggedIn = localStorage.getItem('nu_islogged') === 'true';
          const localModString = localStorage.getItem(`nu_${docId}_lastModified`);
          if (isLoggedIn && localModString && parseInt(localModString, 10) > lastMod) {
            return; // Ignore older snapshot from cache
          }
        } catch(e) {}
        
        const dataString = JSON.stringify(data);
        if (cache.get(cacheKey) === dataString) {
          return;
        }
        cache.set(cacheKey, dataString);
        callback(data);
      }
    },
    (error: any) => {
      if (error?.code === 'resource-exhausted') {
        console.warn(`[Firebase] Quota exceeded. Skipping sync for ${collectionName}/${docId}.`);
      } else {
        console.error(`Error subscribing to Firebase ${collectionName}/${docId}:`, error);
      }
    }
  );
}

