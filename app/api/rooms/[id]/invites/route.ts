import { z } from 'zod';
import { getRoomView } from '@/lib/engine';
import { saveRoom } from '@/lib/store';
import { authorizedRoom, failure, HttpError, newToken, readBody, response, revisionSchema, tokenHash } from '@/lib/server';
export const runtime = 'nodejs';
const schema = z.object({seatId:z.number().int().min(0).max(7),expectedRevision:revisionSchema}).strict();
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
  try {
    const input = await readBody(request,schema);
    const {id} = await context.params;
    const {state,actor} = await authorizedRoom(request,id);
    if (actor.kind !== 'host') throw new HttpError(403,'Only the host can replace an invitation.');
    if (state.revision !== input.expectedRevision) throw new HttpError(409,'The draft changed. Please refresh and retry.');
    const token = newToken();
    const next = structuredClone(state);
    next.players[input.seatId].tokenHash = tokenHash(token);
    next.revision++;
    next.pendingPreview = null;
    next.updatedAt = new Date().toISOString();
    next.history.push({id:newToken().slice(0,16),text:`The host replaced ${next.players[input.seatId].name}'s invitation.`,at:next.updatedAt});
    next.history = next.history.slice(-100);
    if (!await saveRoom(next,input.expectedRevision)) throw new HttpError(409,'Another action was saved first. Please retry.');
    return response({token,room:getRoomView(next,actor)});
  } catch (error) { return failure(error); }
}
