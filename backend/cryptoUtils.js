const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// The secret key for AES-256-CBC encryption must be exactly 32 bytes (256 bits).
// This key is used to encrypt and decrypt the data. It should be a random, securely generated value.
// Store this key securely in your .env file as a hex string (64 characters long).
// Example: ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// The Initialization Vector (IV) for AES-256-CBC must be exactly 16 bytes (128 bits).
// The IV adds randomness to the encryption process, ensuring that identical plaintexts encrypt to different ciphertexts.
// It should be a random, unique value for each encryption operation, but for simplicity in this example,
// we're using a fixed IV. In production, consider generating a new IV for each encryption and storing it with the ciphertext.
// Store this IV securely in your .env file as a hex string (32 characters long).
// Example: ENCRYPTION_IV=0123456789abcdef0123456789abcdef
const ENCRYPTION_IV = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

// Function to encrypt a password
function encryptPassword(password) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Function to decrypt a password
function decryptPassword(encryptedPassword) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encryptPassword,
  decryptPassword
};
