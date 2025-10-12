// Voucher generation and signing utilities for Sui blockchain
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/sui.js/utils';
import crypto from 'crypto';
import { bcs } from '@mysten/sui.js/bcs';

// Admin signer configuration
const ADMIN_PRIVATE_KEY = process.env.ADMIN_SIGNER_PRIVATE_KEY;

if (!ADMIN_PRIVATE_KEY) {
  console.warn('⚠️ ADMIN_SIGNER_PRIVATE_KEY not set. Voucher signing will fail.');
}

/**
 * Get the admin signer keypair
 */
export function getAdminSigner(): Ed25519Keypair {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('Admin signer private key not configured');
  }
  
  try {
    const secretKey = fromB64(ADMIN_PRIVATE_KEY);
    return Ed25519Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error('Invalid admin signer private key format');
  }
}

/**
 * Get admin signer address
 */
export function getAdminSignerAddress(): string {
  const signer = getAdminSigner();
  return signer.getPublicKey().toSuiAddress();
}

/**
 * Voucher structure for NFT minting
 */
export interface NFTVoucher {
  voucherId: string;
  targetAddress: string;
  nftTitle: string;
  nftType: string;
  rarity: string;
  level: number;
  metadataUri: string;
  expiry: number;
  reservationId: number;
}

/**
 * Generate a unique voucher ID
 */
export function generateVoucherId(reservationId: number, email: string): string {
  const data = `${reservationId}-${email}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create voucher data structure
 */
export function createVoucher(
  reservationId: number,
  targetAddress: string,
  nftTitle: string,
  nftType: string,
  rarity: string,
  level: number,
  metadataUri: string,
  email: string,
  expiryDays: number = 30
): NFTVoucher {
  const voucherId = generateVoucherId(reservationId, email);
  const expiry = Math.floor(Date.now() / 1000) + (expiryDays * 86400); // Convert to seconds

  return {
    voucherId,
    targetAddress,
    nftTitle,
    nftType,
    rarity,
    level,
    metadataUri,
    expiry,
    reservationId,
  };
}

/**
 * Create message hash for voucher signing
 * This creates a deterministic hash that can be verified on-chain
 */
export function createVoucherMessageHash(voucher: NFTVoucher): Uint8Array {
  // Create a structured message for signing
  const message = [
    voucher.voucherId,
    voucher.targetAddress,
    voucher.nftTitle,
    voucher.nftType,
    voucher.rarity,
    voucher.level.toString(),
    voucher.metadataUri,
    voucher.expiry.toString(),
    voucher.reservationId.toString(),
  ].join('|');

  // Hash the message
  const hash = crypto.createHash('sha256').update(message).digest();
  return hash;
}

/**
 * Sign a voucher with the admin private key
 */
export function signVoucher(voucher: NFTVoucher): string {
  const signer = getAdminSigner();
  const messageHash = createVoucherMessageHash(voucher);
  
  // Sign the hash
  const signature = signer.signData(messageHash);
  
  // Return base64 encoded signature
  return Buffer.from(signature).toString('base64');
}

/**
 * Verify a voucher signature (for testing/validation)
 */
export function verifyVoucherSignature(
  voucher: NFTVoucher,
  signature: string
): boolean {
  try {
    const signer = getAdminSigner();
    const messageHash = createVoucherMessageHash(voucher);
    const signatureBytes = Buffer.from(signature, 'base64');
    
    return signer.getPublicKey().verify(messageHash, signatureBytes);
  } catch (error) {
    console.error('Voucher verification failed:', error);
    return false;
  }
}

/**
 * Check if voucher is expired
 */
export function isVoucherExpired(expiry: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= expiry;
}

/**
 * Generate voucher with signature
 */
export function generateSignedVoucher(
  reservationId: number,
  targetAddress: string,
  nftTitle: string,
  nftType: string,
  rarity: string,
  level: number,
  metadataUri: string,
  email: string,
  expiryDays: number = 30
): { voucher: NFTVoucher; signature: string } {
  const voucher = createVoucher(
    reservationId,
    targetAddress,
    nftTitle,
    nftType,
    rarity,
    level,
    metadataUri,
    email,
    expiryDays
  );

  const signature = signVoucher(voucher);

  return { voucher, signature };
}

/**
 * Batch generate vouchers for multiple reservations
 */
export function generateBatchVouchers(
  reservations: Array<{
    id: number;
    targetAddress: string;
    nftTitle: string;
    nftType: string;
    rarity: string;
    level: number;
    metadataUri: string;
    email: string;
  }>,
  expiryDays: number = 30
): Array<{ reservationId: number; voucher: NFTVoucher; signature: string }> {
  return reservations.map((reservation) => {
    const { voucher, signature } = generateSignedVoucher(
      reservation.id,
      reservation.targetAddress,
      reservation.nftTitle,
      reservation.nftType,
      reservation.rarity,
      reservation.level,
      reservation.metadataUri,
      reservation.email,
      expiryDays
    );

    return {
      reservationId: reservation.id,
      voucher,
      signature,
    };
  });
}

