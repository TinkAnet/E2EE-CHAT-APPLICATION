// Define global variables for storing keys
console.log("ecdh.js is loaded");

let sharedSecret;
const derivedKeys = {};

// Function to generate an ECDH key pair using P-384 curve
async function generateKeyPair() {
    return window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-384",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
}

// Function to export a public key to a sharable format
async function exportPublicKey(key) {
    return window.crypto.subtle.exportKey("raw", key);
}

// Function to import a public key from a shared format
async function importPublicKey(rawKey) {
    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        true,
        []
    );
}

// Placeholder function for sending the public key to the server
// Implement actual AJAX/Fetch request to your Flask endpoint
async function sendPublicKeyToServer(userId, publicKey) {
    // Example: POST request to Flask server
}

// Placeholder function for getting the other user's public key from the server
// Implement actual AJAX/Fetch request to your Flask endpoint
async function getOtherPublicKeyFromServer(otherUserId) {
    // Example: GET request to Flask server
}

// Function to derive the shared secret using your private key and the other user's public key
async function deriveSharedSecret(yourPrivateKey, othersPublicKey) {
    const importedPublicKey = await importPublicKey(othersPublicKey);
    return window.crypto.subtle.deriveBits(
        {
            name: "ECDH",
            public: importedPublicKey
        },
        yourPrivateKey,
        384 // Length in bits
    );
}

// Function to derive encryption and MAC keys from the shared secret using HKDF
async function deriveKeys(sharedSecret, salt, otherUserId, direction = 'to') {
    const sharedSecretKey = await window.crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "HKDF" },
        false,
        ["deriveKey"]
    );

    // Define HKDF parameters for encryption and MAC keys
    const baseInfo = `CHAT_KEY_USER${direction}${otherUserId}`;
    const encryptionInfo = `${baseInfo}_ENCRYPTION`;
    const macInfo = `${baseInfo}_MAC`;

    // Derive the AES-GCM encryption key
    const aesKey = await window.crypto.subtle.deriveKey(
        {
            name: "HKDF",
            salt: salt,
            info: new TextEncoder().encode(encryptionInfo),
            hash: "SHA-256"
        },
        sharedSecretKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    // Derive the HMAC key
    const macKey = await window.crypto.subtle.deriveKey(
        {
            name: "HKDF",
            salt: salt,
            info: new TextEncoder().encode(macInfo),
            hash: "SHA-256"
        },
        sharedSecretKey,
        { name: "HMAC", hash: "SHA-256" },
        true,
        ["sign", "verify"]
    );

    return { aesKey, macKey };
}

// start the ECDH key exchange and key derivation process
async function startKeyExchange(yourUserId, otherUserId) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16)); // Example unique salt
    const { aesKey, macKey } = await deriveKeys(sharedSecret, salt, otherUserId, 'to');

    console.log("Derived AES Key:", aesKey);
    console.log("Derived MAC Key:", macKey);
}

// Example: Expose the startKeyExchange function to be callable from the global scope for testing
window.startKeyExchange = startKeyExchange;
