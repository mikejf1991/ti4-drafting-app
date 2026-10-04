import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { Actor, RoomState } from './types';
import { getRoom, StorageError } from './store';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const secureRandom = () => randomInt(0, 2 ** 32) / (2 ** 32);
export const response = (data: unknown, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store, private', 'Vary':'Authorization'}});
export const idSchema = z.string().uuid();
export const actionSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('rank'),ranking:z.array(z.number().int()).length(8)}).strict(),
  z.object({type:z.literal('rename'),name:z.string().trim().min(1).max(32)}).strict(),
  z.object({type:z.literal('place'),tileId:z.number().int().min(1).max(80),cellId:z.string().regex(/^-?\d,-?\d$/)}).strict(),
  z.object({type:z.literal('preview'),move:z.object({tileId:z.number().int().min(1).max(80),cellId:z.string().regex(/^-?\d,-?\d$/)}).strict().nullable()}).strict(),
  z.object({type:z.literal('undo')}).strict(),
  z.object({type:z.literal('practice-fill')}).strict(),
]);
export const revisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const actionRequestSchema = z.object({
  expectedRevision: revisionSchema,
  expectedPreviewVersion: revisionSchema.optional(),
  action: actionSchema,
}).strict().refine(input => input.action.type !== 'preview' || input.expectedPreviewVersion !== undefined, {
  message: 'A preview version is required for preview changes.', path: ['expectedPreviewVersion'],
});

export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) throw new HttpError(403, 'Requests must come from this app.');
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'A JSON request is required.');
  if (Number(request.headers.get('content-length') || 0) > 16000) throw new HttpError(413,'Request is too large.');
  const text = await request.text();
  if (text.length > 16000) throw new HttpError(413, 'Request is too large.');
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, 'The request could not be read.'); }
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, 'Please check the submitted values.');
  return result.data;
}

export function authenticate(state: RoomState, token: string): Actor {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new HttpError(401, 'Open your private invitation link to enter this room.');
  const hash = Buffer.from(tokenHash(token), 'hex');
  const matches = (expected: string) => {
    const target = Buffer.from(expected, 'hex');
    return target.length === hash.length && timingSafeEqual(target, hash);
  };
  if (matches(state.hostTokenHash)) return {kind:'host'};
  const player = state.players.find(p => matches(p.tokenHash));
  if (!player) throw new HttpError(401, 'This invitation is invalid or has been replaced. Ask the host for a new link.');
  return {kind:'seat', seatId:player.id};
}

export async function authorizedRoom(request: Request, id: string) {
  if (!idSchema.safeParse(id).success) throw new HttpError(404, 'Draft not found.');
  const bearer = request.headers.get('authorization') || '';
  if (!bearer.startsWith('Bearer ')) throw new HttpError(401, 'Open your private invitation link to enter this room.');
  const state = await getRoom(id);
  if (!state) throw new HttpError(404, 'Draft not found. Check the invitation link.');
  return {state, actor:authenticate(state, bearer.slice(7))};
}

export function failure(error: unknown) {
  if (error instanceof HttpError) return response({error:error.message}, error.status);
  if (error instanceof StorageError) return response({error:error.message}, 503);
  // Domain errors are rendered explicitly by the action route; unexpected errors remain private.
  return response({error:'Something went wrong. Please try again.'}, 500);
}
