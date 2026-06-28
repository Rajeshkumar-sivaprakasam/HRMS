import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { TokenExpired, TokenInvalid } from '../exceptions/base';

interface AccessTokenPayload {
  sub: string;
  employee_id: string;
  role: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

let privateKey: jose.KeyLike | null = null;
let publicKey: jose.KeyLike | null = null;

async function getPrivateKey(): Promise<jose.KeyLike> {
  if (!privateKey) {
    const pemKey = config.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    privateKey = await jose.importPKCS8(pemKey, config.JWT_ALGORITHM);
  }
  return privateKey;
}

async function getPublicKey(): Promise<jose.KeyLike> {
  if (!publicKey) {
    const pemKey = config.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    publicKey = await jose.importSPKI(pemKey, config.JWT_ALGORITHM);
  }
  return publicKey;
}

export async function createAccessToken(
  userId: string,
  employeeId: string,
  role: string,
  email: string
): Promise<string> {
  const key = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + config.ACCESS_TOKEN_EXPIRE_MINUTES * 60;

  return new jose.SignJWT({
    sub: userId,
    employee_id: employeeId,
    role,
    email,
    type: 'access',
    jti: uuidv4(),
  })
    .setProtectedHeader({ alg: config.JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const key = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + config.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60;

  return new jose.SignJWT({
    sub: userId,
    type: 'refresh',
    jti: uuidv4(),
  })
    .setProtectedHeader({ alg: config.JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);
}

export async function decodeAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const key = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: [config.JWT_ALGORITHM],
    });

    if (payload.type !== 'access') {
      throw new TokenInvalid();
    }

    return payload as unknown as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      throw new TokenExpired();
    }
    if (err instanceof TokenInvalid || err instanceof TokenExpired) {
      throw err;
    }
    throw new TokenInvalid();
  }
}

export async function decodeRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const key = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: [config.JWT_ALGORITHM],
    });

    if (payload.type !== 'refresh') {
      throw new TokenInvalid();
    }

    return payload as unknown as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      throw new TokenExpired();
    }
    if (err instanceof TokenInvalid || err instanceof TokenExpired) {
      throw err;
    }
    throw new TokenInvalid();
  }
}
