const crypto = require('crypto');

// Your extension's public key (from manifest.json)
const publicKeyBase64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7Q3rPRswX+Cxu6g/AQ4eyYy3Ru4GDP0h9DRmN1S5bYosOb5pNeIDOpYSBhwdgPETTqM6/4+BtFoNaqxxdNH2qhUs/+nmzXp8W6K+rNNI20utYqn6airnFt4J55OHG2dZbZLVsRaE+PgFCBzNV9/Jin9gWBRcPT5F6q2AUxEVgGwdO3E/WgsbHGgL+PL6+2tuiXtEgRXrpo6uTvONwGCGosrFpGJvtC8AaPrK5/ESNIXX==";

// Convert base64 to buffer
const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');

// Calculate SHA256 hash
const hash = crypto.createHash('sha256').update(publicKeyBuffer).digest();

// Take first 16 bytes and convert to extension ID format (a-p)
let extensionId = '';
for (let i = 0; i < 16; i++) {
    extensionId += String.fromCharCode(97 + (hash[i] & 15)) + String.fromCharCode(97 + ((hash[i] >> 4) & 15));
}

console.log('Extension ID:', extensionId);
console.log('Redirect URI:', `https://${extensionId}.chromiumapp.org/`);
