import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createRoomState, getRoomView } from '@/lib/engine';
import { insertRoom } from '@/lib/store';
import { failure, newToken, tokenHash, readBody, response, secureRandom } from '@/lib/server';

export const runtime = 'nodejs';
const schema = z.object({title:z.string().trim().min(1).max(80), names:z.array(z.string().trim().min(1).max(32)).length(8), practice:z.boolean().default(false)}).strict();
export async function POST(request: Request) {
  try {
    const input = await readBody(request, schema);
    const hostToken = newToken();
    const seatTokens = Array.from({length:8},newToken);
    const state = createRoomState({...input,id:randomUUID(),hostTokenHash:tokenHash(hostToken),seatTokenHashes:seatTokens.map(tokenHash)},secureRandom);
    await insertRoom(state);
    return response({room:getRoomView(state,{kind:'host'}),hostToken,seatTokens},201);
  } catch (error) { return failure(error); }
}
