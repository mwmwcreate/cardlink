import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
  serverTimestamp, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

/** 名刺を作成または更新 */
export async function saveCard(uid, cardData) {
  const ref = doc(db, "cards", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...cardData, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, { ...cardData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

/** UIDで名刺を取得 */
export async function getCard(uid) {
  const snap = await getDoc(doc(db, "cards", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** ユーザー名で名刺を取得 */
export async function getCardByUsername(username) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  return await getCard(user.id);
}

/** ユーザー名からユーザー情報を取得 */
export async function getUserByUsername(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** 名刺をコレクションに保存 */
export async function saveCardToCollection(uid, cardOwnerUid) {
  if (uid === cardOwnerUid) return;
  const ref = doc(db, "collections", uid, "savedCards", cardOwnerUid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, { cardOwnerUid, savedAt: serverTimestamp(), note: "" });
  }
}

/** コレクションから名刺を削除 */
export async function removeFromCollection(uid, cardOwnerUid) {
  await deleteDoc(doc(db, "collections", uid, "savedCards", cardOwnerUid));
}

/** 保存した名刺の一覧を取得 */
export async function getCollection(uid) {
  const ref = collection(db, "collections", uid, "savedCards");
  const q = query(ref, orderBy("savedAt", "desc"));
  const snap = await getDocs(q);
  
  // N+1問題の解消：Promise.allで並列にカード情報を取得する
  const fetchPromises = snap.docs.map(async (d) => {
    const data = d.data();
    const card = await getCard(data.cardOwnerUid);
    const user = await getUser(data.cardOwnerUid);
    return card && user ? { id: d.id, ...data, card, ownerUsername: user.username } : null;
  });
  
  const results = await Promise.all(fetchPromises);
  return results.filter(Boolean);
}

/** 特定の名刺がコレクションに保存されているか確認（保存されている場合はデータを返す） */
export async function isCardSaved(uid, cardOwnerUid) {
  const ref = doc(db, "collections", uid, "savedCards", cardOwnerUid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/** コレクションに保存した名刺のメモを更新 */
export async function updateCardNote(uid, cardOwnerUid, note) {
  const ref = doc(db, "collections", uid, "savedCards", cardOwnerUid);
  await updateDoc(ref, { note, updatedAt: serverTimestamp() });
}

/** ユーザー名を更新 */
export async function updateUsername(uid, newUsername) {
  const existing = await getUserByUsername(newUsername);
  if (existing && existing.id !== uid) throw new Error("このユーザー名は既に使用されています");
  await updateDoc(doc(db, "users", uid), { username: newUsername, updatedAt: serverTimestamp() });
}

/** ユーザー情報を取得 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
