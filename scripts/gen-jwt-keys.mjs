import { generateKeyPairSync } from 'crypto';
import fs from 'fs';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync('jwt_private.pem', privateKey);
fs.writeFileSync('jwt_public.pem', publicKey);

function escapeForEnv(pem) {
  return pem.replace(/\r?\n/g, '\\n');
}

console.log('===ENV_SNIPPET_START===');
console.log('JWT_PRIVATE_KEY="' + escapeForEnv(privateKey) + '"');
console.log('JWT_PUBLIC_KEY="' + escapeForEnv(publicKey) + '"');
console.log('===ENV_SNIPPET_END===');
console.log('\nWrote jwt_private.pem and jwt_public.pem to project root.');
