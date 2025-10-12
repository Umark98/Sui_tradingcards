// Wallet utilities for custodial wallet generation and management
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64, toB64 } from '@mysten/sui.js/utils';
import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Generate a new custodial wallet for a user
 */
export function generateCustodialWallet() {
  const keypair = new Ed25519Keypair();
  const publicKey = keypair.getPublicKey();
  const address = publicKey.toSuiAddress();
  const privateKey = keypair.export().privateKey;

  return {
    address,
    privateKey,
    publicKey: publicKey.toBase64(),
  };
}

/**
 * Encrypt private key before storing in database
 */
export function encryptPrivateKey(privateKey: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV + AuthTag + Encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt private key when needed
 */
export function decryptPrivateKey(encryptedData: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Restore keypair from encrypted private key
 */
export function restoreKeypair(encryptedPrivateKey: string): Ed25519Keypair {
  const privateKey = decryptPrivateKey(encryptedPrivateKey);
  const secretKey = fromB64(privateKey);
  return Ed25519Keypair.fromSecretKey(secretKey);
}

/**
 * Generate a verification token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password (if we add password authentication later)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

