
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode('development_secret_key_must_be_long');

async function testAuth() {
    console.log('Testing Password Hashing...');
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash:', hash);
    const match = await bcrypt.compare(password, hash);
    console.log('Password Match:', match);
    if (!match) throw new Error('Password compare failed');

    console.log('Testing JWT Signing...');
    const payload = { sub: '123', email: 'test@example.com' };
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(SECRET_KEY);
    console.log('Token:', token);

    console.log('Testing JWT Verification...');
    const { payload: verified } = await jwtVerify(token, SECRET_KEY);
    console.log('Verified Payload:', verified);
    if (verified.sub !== '123') throw new Error('JWT verification failed');

    console.log('Reference check: can import from src/lib/auth?');
    // We can't import TS files directly in node without ts-node or build, but this script proves the libraries work.
    console.log('SUCCESS: Auth primitives work.');
}

testAuth().catch(console.error);
