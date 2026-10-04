import { applyAction, getRoomView } from '@/lib/engine';
import { saveRoom } from '@/lib/store';
import { actionRequestSchema, authorizedRoom, failure, HttpError, readBody, response, secureRandom } from '@/lib/server';
export const runtime = 'nodejs';
export async function POST(request:Request, context:{params:Promise<{id:string}>}) {
  try {
    const input = await readBody(request,actionRequestSchema);
    const {id} = await context.params;
    const {state,actor} = await authorizedRoom(request,id);
    if (state.revision !== input.expectedRevision) throw new HttpError(409,'The draft has changed. Refreshing the board; please review your move.');
    const expectedPreviewVersion = input.action.type === 'preview' ? input.expectedPreviewVersion : undefined;
    if (expectedPreviewVersion !== undefined && (state.previewVersion ?? 0) !== expectedPreviewVersion) throw new HttpError(409,'The preview has changed. Refresh and retry the latest selection.');
    let next;
    try { next = applyAction(state,actor,input.action,secureRandom); }
    catch(error) { throw new HttpError(400,error instanceof Error ? error.message : 'That move is not allowed.'); }
    if (!await saveRoom(next,input.expectedRevision,expectedPreviewVersion)) throw new HttpError(409,'Another action was saved first. Please review the updated draft.');
    return response(getRoomView(next,actor));
  } catch (error) { return failure(error); }
}
