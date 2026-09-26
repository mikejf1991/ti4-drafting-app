// Runs against the app's actual HTTP interface, creating two clearly marked practice rooms.
// Never prints invitation secrets. Use against your own local/staging deployment.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:3000';
if (!/^https?:\/\//.test(base)) throw new Error('Provide an http(s) app URL.');
const tiles = JSON.parse(await readFile(new URL('../data/tiles.json', import.meta.url), 'utf8'));
function assertColors(ids, blue, red) {
  assert.equal(ids.filter(id => tiles[id]?.type === 'blue').length, blue);
  assert.equal(ids.filter(id => tiles[id]?.type === 'red').length, red);
  assert.equal(ids.length, blue + red);
}
function isMecatolNeighbor(cellId) {
  const [q, r] = cellId.split(',').map(Number);
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) === 1;
}
const checks = [];
async function request(route, token, body) {
  const result = await fetch(`${base}${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {...(token ? {Authorization:`Bearer ${token}`} : {}), ...(body === undefined ? {} : {'Content-Type':'application/json'})},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await result.json();
  return {status:result.status,data};
}
const created = await request('/api/rooms',null,{title:`API verification ${new Date().toISOString()}`,names:Array.from({length:8},(_,i)=>`Test seat ${i+1}`),practice:true});
assert.equal(created.status,201,'Room creation must succeed');
const {hostToken,seatTokens} = created.data;
const id = created.data.room.id;
const route = `/api/rooms/${id}`;
const view = async token => {
  const result = await request(route,token);
  assert.equal(result.status,200,JSON.stringify(result.data));
  return result.data;
};
const act = async (token,action,revision) => request(`${route}/actions`,token,{expectedRevision:revision ?? (await view(token)).revision,action});
async function assertOpeningViews(speaker, remaining) {
  const snapshots = await Promise.all(seatTokens.map(view));
  for (let seatId = 0; seatId < 8; seatId++) {
    const snapshot = snapshots[seatId];
    assert.equal(snapshot.phase, 'speaker');
    assert.deepEqual(snapshot.myHand, []);
    assert.equal(snapshot.speakerPool.length, seatId === speaker ? remaining : 0);
    assert.deepEqual(snapshot.players.map(player => player.handCount),
      Array.from({length:8}, (_, id) => id === speaker ? remaining : 0));
  }
  return snapshots[speaker];
}
async function readDealtHands() {
  const snapshots = await Promise.all(seatTokens.map(view));
  for (const snapshot of snapshots) {
    assert.equal(snapshot.phase, 'placement');
    assert.equal(snapshot.speakerPool.length, 0);
    assert.deepEqual(snapshot.players.map(player => player.handCount), Array(8).fill(6));
    assertColors(snapshot.myHand, 4, 2);
  }
  return snapshots.map(snapshot => snapshot.myHand);
}
assert.equal((await request(route,null)).status,401);
assert.equal((await request(route,'invalid')).status,401);
checks.push('Private invitations required');
const before = await view(seatTokens[0]);
const concurrent = await Promise.all([0,1].map(i=>act(seatTokens[i],{type:'rank',ranking:[1,2,3,4,5,6,7,8]},before.revision)));
assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
checks.push('Concurrent submissions cannot overwrite each other');
for(let i=0;i<8;i++) {
  const snapshot = await view(seatTokens[i]);
  assert.equal('hostTokenHash' in snapshot,false);
  assert.equal('unusedTiles' in snapshot,false);
  assert.ok(snapshot.players.every(p=> !('ranking' in p) && !('hand' in p) && !('tokenHash' in p)));
  if (i<7 && snapshot.phase === 'factions') assert.ok(snapshot.players.every(p=>p.factionId===null));
  if (!snapshot.myRanking) {
    const result = await act(seatTokens[i],{type:'rank',ranking:[1,2,3,4,5,6,7,8]});
    assert.equal(result.status,200,JSON.stringify(result.data));
  }
}
checks.push('Eight identical rankings resolve uniquely; no other ranking or private hand is exposed');
let host = await view(hostToken);
assert.equal(host.phase,'speaker');
assert.equal(new Set(host.players.map(p=>p.factionId)).size,8);
assert.equal(host.myHand.length,0);
assert.equal(host.speakerPool.length,0);
assert.equal(host.legalMoves.length,0);
assert.ok(!JSON.stringify(host).includes('tokenHash'));
const speaker = host.speaker;
const initialSpeaker = await assertOpeningViews(speaker, 4);
assertColors(initialSpeaker.speakerPool, 2, 2);
checks.push('Only the speaker sees four opening tiles; no player hand is dealt yet');
const rotated = await request(`${route}/invites`,hostToken,{seatId:7,expectedRevision:host.revision});
assert.equal(rotated.status,200);
assert.equal((await request(route,seatTokens[7])).status,401);
seatTokens[7]=rotated.data.token;
assert.equal((await view(seatTokens[7])).actor.seatId,7);
checks.push('Replacing an invitation revokes the previous link');
host=await view(hostToken);
const wrongPlayer=(host.currentPlayer+1)%8;
const speakerView=await view(seatTokens[host.currentPlayer]);
const move=speakerView.legalMoves[0];
assert.ok(move);
const validMove={type:'place',tileId:move.tileId,cellId:move.cellId};
const outOfTurn=await act(seatTokens[wrongPlayer],validMove);
assert.equal(outOfTurn.status,400);
assert.match(outOfTurn.data.error,/not your turn/i);
assert.equal((await act(hostToken,validMove)).status,400);
const attempt=await Promise.all([act(seatTokens[host.currentPlayer],validMove,host.revision),act(seatTokens[host.currentPlayer],validMove,host.revision)]);
assert.deepEqual(attempt.map(r=>r.status).sort(),[200,409]);
assert.equal((await act(hostToken,{type:'undo'})).status,200);
assert.equal((await view(hostToken)).placements.length,0);
checks.push('Placement is authorized and atomic; host undo restores the move');
const openingMoves=[];
for(let opening=0; opening<4; opening++) {
  host=await view(hostToken);
  assert.equal(host.currentPlayer,speaker);
  const player=await view(seatTokens[speaker]);
  const next=player.legalMoves[0];
  assert.ok(next);
  assert.ok(isMecatolNeighbor(next.cellId), 'Opening tiles must border Mecatol Rex');
  const result=await act(seatTokens[speaker],{type:'place',tileId:next.tileId,cellId:next.cellId},player.revision);
  assert.equal(result.status,200,'Opening placement must save');
  openingMoves.push(next);
  if(opening<3) await assertOpeningViews(speaker,3-opening);
}
host=await view(hostToken);
assert.equal(host.phase,'placement');
assert.equal(host.currentPlayer,speaker);
assert.equal(host.placements.filter(placement=>placement.kind==='seed').length,4);
assert.ok(host.placements.filter(placement=>placement.kind==='seed').every(placement=>isMecatolNeighbor(placement.cellId)));
const firstDeal=await readDealtHands();
checks.push('Four opening placements border Mecatol; all eight hands deal only afterward');

const lastOpening=openingMoves[3];
assert.equal((await act(hostToken,{type:'undo'},host.revision)).status,200);
host=await view(hostToken);
assert.equal(host.phase,'speaker');
assert.equal(host.currentPlayer,speaker);
assert.equal(host.placements.length,3);
assert.equal(host.board[lastOpening.cellId],undefined);
await assertOpeningViews(speaker,1);
const replay=await act(seatTokens[speaker],{type:'place',tileId:lastOpening.tileId,cellId:lastOpening.cellId},host.revision);
assert.equal(replay.status,200,'Replaying the fourth opening tile must save');
assert.deepEqual(await readDealtHands(),firstDeal);
checks.push('Undoing the fourth opening tile withdraws hands; replay preserves the exact deal');

host=await view(hostToken);
const speakerPriorityIndex=host.priority.indexOf(speaker);
assert.ok(speakerPriorityIndex>=0);
const clockwise=[...host.priority.slice(speakerPriorityIndex),...host.priority.slice(0,speakerPriorityIndex)];
const oneSnake=[...clockwise,...clockwise.toReversed()];
const regularOrder=Array.from({length:3},()=>oneSnake).flat();
const lastSeat=clockwise.at(-1);
for(const turn of [0,15,16,31,32,47]) assert.equal(regularOrder[turn],speaker);
for(const turn of [7,8,23,24,39,40]) assert.equal(regularOrder[turn],lastSeat);
for(let turn=0; turn<48; turn++) {
  host=await view(hostToken);
  assert.equal(host.currentPlayer,regularOrder[turn],`Wrong player on regular pick ${turn+1}`);
  const player=await view(seatTokens[regularOrder[turn]]);
  const next=player.legalMoves[0];
  assert.ok(next);
  const result=await act(seatTokens[regularOrder[turn]],{type:'place',tileId:next.tileId,cellId:next.cellId},player.revision);
  assert.equal(result.status,200,`Regular pick ${turn+1} must save`);
}
host=await view(hostToken);
assert.deepEqual(host.placements.filter(placement=>placement.kind==='draft').map(placement=>placement.seatId),regularOrder);
assert.equal(host.placements.length,52);
assert.equal(host.phase,'complete');
assert.equal(Object.keys(host.board).length,61);
assert.equal(new Set(Object.values(host.board)).size,61);
assert.ok(host.players.every(p=>p.handCount===0));
assert.equal(host.currentPlayer,null);
checks.push('All 48 regular picks follow speaker-first clockwise snake; 61 unique board tiles finish');
const second = await request('/api/rooms',null,{title:'Invitation isolation verification',names:Array.from({length:8},(_,i)=>`Seat ${i+1}`),practice:false});
assert.equal(second.status,201);
assert.equal((await request(`/api/rooms/${second.data.room.id}`,seatTokens[0])).status,401);
const real = await request(`/api/rooms/${second.data.room.id}/actions`,second.data.hostToken,{expectedRevision:0,action:{type:'practice-fill'}});
assert.equal(real.status,400);
checks.push('Cross-room credentials are rejected; practice shortcuts unavailable in real drafts');
console.log(JSON.stringify({passed:checks,roomsCreated:[id,second.data.room.id],finalBoardTiles:Object.keys(host.board).length},null,2));
