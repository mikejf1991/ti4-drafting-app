import { storageReady } from '@/lib/store';
import { response } from '@/lib/server';
export const runtime = 'nodejs';
export async function GET() {
  try { await storageReady(); return response({ok:true}); }
  catch { return response({ok:false},503); }
}
