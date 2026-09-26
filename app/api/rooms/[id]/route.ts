import { getRoomView } from '@/lib/engine';
import { authorizedRoom, failure, response } from '@/lib/server';
export const runtime = 'nodejs';
export async function GET(request:Request, context:{params:Promise<{id:string}>}) {
  try {
    const {id} = await context.params;
    const {state,actor} = await authorizedRoom(request,id);
    return response(getRoomView(state,actor));
  } catch (error) { return failure(error); }
}
