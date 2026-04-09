import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;

if (!MASTER_KEY || MASTER_KEY.length !== 32) {
    console.warn('MASTER_ENCRYPTION_KEY is not set or not 32 bytes long in .env');
}

/**
 * Encrypts a buffer using a specific 32-byte key and 16-byte IV
 */
export const encryptBuffer = (buffer, key, iv) => {
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return encrypted;
};

/**
 * Decrypts a buffer using a specific 32-byte key and 16-byte IV
 */
export const decryptBuffer = (encryptedBuffer, key, iv) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
};

/**
 * Encrypts a key using the Master Key
 */
export const encryptKeyWithMaster = (keyToEncrypt) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(MASTER_KEY, 'utf-8'), iv);
    let encrypted = cipher.update(keyToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Return iv:encryptedData as hex
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts a key using the Master Key
 */
export const decryptKeyWithMaster = (encryptedKeyData) => {
    const parts = encryptedKeyData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = Buffer.from(parts[1], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(MASTER_KEY, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted; // This is the original 32-byte key buffer
};

/**
 * Generates a random 32-byte encryption key
 */
export const generateFileKey = () => {
    return crypto.randomBytes(32);
};

/**
 * Generates a random 16-byte Initialization Vector
 */
export const generateIV = () => {
    return crypto.randomBytes(16);
};
