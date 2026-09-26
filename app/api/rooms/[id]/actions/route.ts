import { z } from 'zod';
import { applyAction, getRoomView } from '@/lib/engine';
import { saveRoom } from '@/lib/store';
import { actionSchema, authorizedRoom, failure, HttpError, readBody, response, revisionSchema, secureRandom } from '@/lib/server';
export const runtime = 'nodejs';
const schema = z.object({expectedRevision:revisionSchema,action:actionSchema}).strict();
export async function POST(request:Request, context:{params:Promise<{id:string}>}) {
  try {
    const input = await readBody(request,schema);
    const {id} = await context.params;
    const {state,actor} = await authorizedRoom(request,id);
    if (state.revision !== input.expectedRevision) throw new HttpError(409,'The draft has changed. Refreshing the board; please review your move.');
    let next;
    try { next = applyAction(state,actor,input.action,secureRandom); }
    catch(error) { throw new HttpError(400,error instanceof Error ? error.message : 'That move is not allowed.'); }
    if (!await saveRoom(next,input.expectedRevision)) throw new HttpError(409,'Another action was saved first. Please review the updated draft.');
    return response(getRoomView(next,actor));
  } catch (error) { return failure(error); }
}
