import { doc, getDoc, setDoc, onSnapshot, disableNetwork } from "firebase/firestore";
import { db } from "./firebase";

const cache = new Map<string, string>();
const receivedSnapshots = new Set<string>();

const QUOTA_STORAGE_KEY = "nu_firestore_quota_exhausted";
const QUOTA_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export function isFirestoreQuotaExhausted(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return false;
    const time = parseInt(raw, 10);
    if (isNaN(time)) return false;
    if (Date.now() - time < QUOTA_DURATION_MS) {
      return true;
    } else {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      return false;
    }
  } catch (e) {
    return false;
  }
}

export function setFirestoreQuotaExhausted() {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(QUOTA_STORAGE_KEY, Date.now().toString());
    }
  } catch (e) {}
  // Gracefully disable network on client to eliminate background retry loops
  disableNetwork(db).catch(() => {});
}

// Immediately switch to offline cache on startup if quota is known to be exceeded
if (typeof window !== "undefined" && isFirestoreQuotaExhausted()) {
  disableNetwork(db).catch(() => {});
}

export async function syncToFirebase(collectionName: string, docId: string, data: any) {
  const cacheKey = `${collectionName}_${docId}`;
  const dataString = JSON.stringify(data);

  if (cache.get(cacheKey) === dataString) {
    return;
  }

  // When quota is exhausted, operate seamlessly using local storage
  if (isFirestoreQuotaExhausted()) {
    cache.set(cacheKey, dataString);
    return;
  }

  try {
    const sanitizedData = JSON.parse(dataString);
    
    if (dataString.length > 800000) {
      if (Array.isArray(sanitizedData)) {
        const CHUNK_SIZE = 50;
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
        const CHUNK_SIZE = 500000;
        const chunks = [];
        for (let i = 0; i < dataString.length; i += CHUNK_SIZE) {
          chunks.push(dataString.substring(i, i + CHUNK_SIZE));
        }
        
        await setDoc(doc(db, collectionName, docId), { 
          isStringChunked: true,
          numChunks: chunks.length,
          _lastModified: Date.now() 
        }, { merge: true });
        
        for (let i = 0; i < chunks.length; i++) {
          await setDoc(doc(db, collectionName, `${docId}_string_chunk_${i}`), {
            chunkStr: chunks[i],
            _lastModified: Date.now()
          }, { merge: true });
        }
      }
    } else {
      await setDoc(doc(db, collectionName, docId), { data: sanitizedData, isChunked: false, _lastModified: Date.now() }, { merge: true });
    }
    
    cache.set(cacheKey, dataString);
  } catch (error: any) {
    cache.set(cacheKey, dataString);
    if (error?.code === "resource-exhausted") {
      setFirestoreQuotaExhausted();
      console.warn(`[Firebase] Quota limit reached. Operating in offline/local storage mode.`);
    } else {
      console.error(`Error syncing to Firebase ${collectionName}/${docId}:`, error);
    }
  }
}

export function subscribeToFirebase(collectionName: string, docId: string, callback: (data: any, fromCache: boolean, dataChanged: boolean, lastMod?: number) => void) {
  if (isFirestoreQuotaExhausted()) {
    return () => {};
  }

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
        const isStringChunked = docData.isStringChunked;
        
        try {
          const localModString = localStorage.getItem(`nu_${docId}_lastModified`);
          if (localModString && parseInt(localModString, 10) > lastMod) {
            return;
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
              } catch (e: any) {
                if (e?.code === "resource-exhausted") setFirestoreQuotaExhausted();
                console.warn(`[Firebase] Could not fetch chunk ${i} for ${docId}`);
              }
            }
            data = allData;
          } else if (isStringChunked) {
            const numChunks = docData.numChunks || 0;
            let fullString = "";
            for (let i = 0; i < numChunks; i++) {
              try {
                const chunkSnap = await getDoc(doc(db, collectionName, `${docId}_string_chunk_${i}`));
                if (chunkSnap.exists() && chunkSnap.data().chunkStr) {
                  fullString += chunkSnap.data().chunkStr;
                }
              } catch (e: any) {
                if (e?.code === "resource-exhausted") setFirestoreQuotaExhausted();
                console.warn(`[Firebase] Could not fetch string chunk ${i} for ${docId}`);
              }
            }
            try {
              if (fullString) {
                data = JSON.parse(fullString);
              }
            } catch (e) {
              console.error(`[Firebase] Could not parse string chunk for ${docId}`);
            }
          } else if (!data) {
            callback(null, isFromCache, true);
            return;
          }
          
          const dataString = JSON.stringify(data);
          const dataChanged = cache.get(cacheKey) !== dataString;
          
          if (dataChanged) {
            cache.set(cacheKey, dataString);
          }
          
          callback(data, isFromCache, dataChanged, lastMod);
        };
        
        processData();
      } else {
        callback(null, isFromCache, true);
      }
    },
    (error: any) => {
      if (error?.code === "resource-exhausted") {
        setFirestoreQuotaExhausted();
        console.warn(`[Firebase] Quota exceeded on subscription. Operating with local cache for ${collectionName}/${docId}.`);
      } else {
        console.error(`Error subscribing to Firebase ${collectionName}/${docId}:`, error);
      }
    }
  );
}
