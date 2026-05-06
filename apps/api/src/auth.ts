import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
const ACCESS_TTL = (process.env.JWT_ACCESS_TTL || '15m') as jwt.SignOptions['expiresIn'];

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    (request as FastifyRequest & { auth: AuthTokenPayload }).auth = payload;
  } catch {
    return reply.status(401).send({ message: 'Unauthorized' });
  }
}
