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
    
    // Check if data is array and large (approaching 1MB limit)
    // Roughly 800KB string length to be safe
    if (Array.isArray(sanitizedData) && dataString.length > 800000) {
      // Save in chunks
      const CHUNK_SIZE = 50; // 50 items per chunk
      const chunks = [];
      for (let i = 0; i < sanitizedData.length; i += CHUNK_SIZE) {
        chunks.push(sanitizedData.slice(i, i + CHUNK_SIZE));
      }
      
      await setDoc(doc(db, collectionName, docId), { 
        isChunked: true,
        numChunks: chunks.length,
        _lastModified: Date.now() 
      }, { merge: true });
      
      for (let i = 0; i < chunks.length; i++) {
        await setDoc(doc(db, collectionName, `${docId}_chunk_${i}`), {
          data: chunks[i],
          _lastModified: Date.now()
        }, { merge: true });
      }
    } else {
      await setDoc(doc(db, collectionName, docId), { data: sanitizedData, isChunked: false, _lastModified: Date.now() }, { merge: true });
    }
    
    cache.set(cacheKey, dataString);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted') {
      console.warn(`[Firebase] Quota exceeded. Using local writes for ${collectionName}/${docId}.`);
    } else {
      console.error(`Error syncing to Firebase ${collectionName}/${docId}:`, error);
    }
  }
}

export function subscribeToFirebase(collectionName: string, docId: string, callback: (data: any, fromCache: boolean, dataChanged: boolean) => void) {
  return onSnapshot(
    doc(db, collectionName, docId),
    { includeMetadataChanges: true },
    (docSnap) => {
      const cacheKey = `${collectionName}_${docId}`;
      const isFromCache = docSnap.metadata.fromCache;
      receivedSnapshots.add(cacheKey);
      
        if (docSnap.exists()) {
        const docData = docSnap.data();
        let data = docData.data;
        const lastMod = docData._lastModified || 0;
        const isChunked = docData.isChunked;
        
        try {
          const isLoggedIn = localStorage.getItem('nu_islogged') === 'true';
          const localModString = localStorage.getItem(`nu_${docId}_lastModified`);
          if (isLoggedIn && localModString && parseInt(localModString, 10) > lastMod) {
            return; // Ignore older snapshot from cache
          }
        } catch(e) {}
        
        const processData = async () => {
          if (isChunked) {
            const numChunks = docData.numChunks || 0;
            let allData: any[] = [];
            for (let i = 0; i < numChunks; i++) {
              try {
                const chunkSnap = await getDoc(doc(db, collectionName, `${docId}_chunk_${i}`));
                if (chunkSnap.exists() && chunkSnap.data().data) {
                  allData = allData.concat(chunkSnap.data().data);
                }
              } catch (e) {
                console.warn(`[Firebase] Could not fetch chunk ${i} for ${docId}`);
              }
            }
            data = allData;
          } else if (!data) {
            callback(null, isFromCache, true);
            return;
          }
          
          const dataString = JSON.stringify(data);
          const dataChanged = cache.get(cacheKey) !== dataString;
          
          if (dataChanged) {
            cache.set(cacheKey, dataString);
          }
          
          callback(data, isFromCache, dataChanged);
        };
        
        processData();
      } else {
        callback(null, isFromCache, true);
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

