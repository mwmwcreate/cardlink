import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * プロフィール画像をアップロード
 * @param {string} uid - ユーザーID
 * @param {File} file - 画像ファイル
 * @returns {string} ダウンロードURL
 */
export async function uploadProfileImage(uid, file) {
  const storageRef = ref(storage, `icons/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
