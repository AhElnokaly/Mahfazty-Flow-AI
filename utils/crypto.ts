// Utility for AES-GCM encryption/decryption using Web Crypto API

export const cryptoUtils = {
  // Derive a key from a password
  async deriveKey(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // Use a fixed salt for simplicity in this demo, but in production, 
    // salt should be random and stored with the data. 
    // Here we use a deterministic salt so we can regenerate the key easily.
    const salt = enc.encode("mahfazty-flow-salt-v1");

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false, // Key is not extractable
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt data
  async encrypt(data: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(data);

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    return {
      cipherText: this.arrayBufferToBase64(encryptedContent),
      iv: this.arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
  },

  // Decrypt data
  async decrypt(cipherText: string, iv: string, key: CryptoKey): Promise<string> {
    const dec = new TextDecoder();
    const encryptedData = this.base64ToArrayBuffer(cipherText);
    const ivData = this.base64ToArrayBuffer(iv);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivData,
      },
      key,
      encryptedData
    );

    return dec.decode(decryptedContent);
  },

  // Helpers
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
};
