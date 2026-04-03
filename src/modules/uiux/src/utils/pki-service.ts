/**
 * PKI Service sử dụng Web Crypto API để ký số thực tế (Real PKI)
 * Hỗ trợ tạo cặp khóa RSA-PSS và ký dữ liệu bằng Private Key lưu trong IndexedDB.
 */

const KEY_DB = 'PKI_KEY_STORE';
const KEY_NAME = 'user-signing-key';

export class PkiService {
  /**
   * Khởi tạo hoặc lấy cặp khóa Ký số của người dùng
   */
  static async getOrCreateKeyPair(): Promise<CryptoKeyPair> {
    const existingKey = await this.loadKey();
    if (existingKey) return existingKey;

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      false, // Không cho phép export Private Key ra ngoài (Bảo mật)
      ["sign", "verify"]
    );

    await this.saveKey(keyPair);
    return keyPair;
  }

  /**
   * Ký số thực trên dữ liệu truyền vào (Real PKI Signature)
   */
  static async signData(data: string): Promise<{ signature: string, publicKey: string }> {
    const keyPair = await this.getOrCreateKeyPair();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const signatureBuffer = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      keyPair.privateKey,
      encodedData
    );

    // Chuyển Signature sang Base64 để gửi về Backend
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    
    // Export Public Key để Backend có thể Verify
    const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(exportedPublic)));

    return { signature, publicKey };
  }

  // --- Logic lưu trữ khóa trong IndexedDB ---
  private static async saveKey(keyPair: CryptoKeyPair): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KEY_DB], 'readwrite');
      const store = transaction.objectStore(KEY_DB);
      store.put(keyPair, KEY_NAME);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private static async loadKey(): Promise<CryptoKeyPair | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KEY_DB], 'readonly');
      const store = transaction.objectStore(KEY_DB);
      const request = store.get(KEY_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PKISecureStore', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(KEY_DB);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
