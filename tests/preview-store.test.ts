import { describe, expect, it, vi } from 'vitest';
import { createRoomState } from '../lib/engine';
import { saveRoom } from '../lib/store';

function room() {
  return createRoomState({
    id: '00000000-0000-4000-8000-000000000001', title: 'Preview CAS',
    names: Array.from({ length: 8 }, (_, i) => `Seat ${i}`),
    seatTokenHashes: Array(8).fill('unused-test-hash'), hostTokenHash: 'unused-test-hash', practice: false,
  });
}

async function remoteSave(expectedPreviewVersion: number | undefined, matched = true) {
  const prior = {
    TI4_STORAGE: process.env.TI4_STORAGE, SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };
  const state = { ...room(), revision: 8, previewVersion: (expectedPreviewVersion ?? 0) + 1 };
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(matched ? [{ id: state.id, state, revision: state.revision }] : []), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  }));
  try {
    process.env.TI4_STORAGE = 'supabase';
    process.env.SUPABASE_URL = 'https://preview-cas-test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test-only-not-a-real-key';
    const saved = await saveRoom(state, 8, expectedPreviewVersion);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [input, init] = fetchMock.mock.calls[0];
    return { saved, url: new URL(String(input)), init };
  } finally {
    fetchMock.mockRestore();
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

describe('Supabase preview compare-and-swap query', () => {
  it('compares both game and preview versions in the same update', async () => {
    const { saved, url, init } = await remoteSave(5);
    expect(saved).toBe(true);
    expect(init?.method).toBe('PATCH');
    expect(url.searchParams.get('revision')).toBe('eq.8');
    expect(url.searchParams.get('state->>previewVersion')).toBe('eq.5');
    expect(url.searchParams.has('or')).toBe(false);
    expect(JSON.parse(String(init?.body)).state.previewVersion).toBe(6);
  });

  it('matches explicit zero, missing, and null legacy JSON versions without a schema migration', async () => {
    const { url } = await remoteSave(0);
    expect(url.searchParams.get('revision')).toBe('eq.8');
    expect(url.searchParams.get('or')).toBe('(state->>previewVersion.is.null,state->>previewVersion.eq.0)');
  });

  it('rejects a lost preview CAS while leaving gameplay writes independent of preview changes', async () => {
    expect((await remoteSave(5, false)).saved).toBe(false);
    const { url } = await remoteSave(undefined);
    expect(url.searchParams.get('revision')).toBe('eq.8');
    expect(url.searchParams.has('state->>previewVersion')).toBe(false);
    expect(url.searchParams.has('or')).toBe(false);
  });
});
