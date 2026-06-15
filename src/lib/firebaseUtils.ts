import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export async function syncToFirebase(collectionName: string, docId: string, data: any) {
  try {
    await setDoc(doc(db, collectionName, docId), { data }, { merge: true });
  } catch (error) {
    console.error("Error syncing to Firebase:", error);
  }
}

export function subscribeToFirebase(collectionName: string, docId: string, callback: (data: any) => void) {
  return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
    if (docSnap.exists() && docSnap.data().data) {
      callback(docSnap.data().data);
    }
  });
}
