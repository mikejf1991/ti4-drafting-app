// Runs against the app's actual HTTP interface, creating two clearly marked practice rooms.
// Never prints invitation secrets. Use against your own local/staging deployment.
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3000';
if (!/^https?:\/\//.test(base)) throw new Error('Provide an http(s) app URL.');
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
assert.equal(created.status,201,JSON.stringify(created.data));
const {hostToken,seatTokens} = created.data;
const id = created.data.room.id;
const route = `/api/rooms/${id}`;
const view = async token => {
  const result = await request(route,token);
  assert.equal(result.status,200,JSON.stringify(result.data));
  return result.data;
};
const act = async (token,action,revision) => request(`${route}/actions`,token,{expectedRevision:revision ?? (await view(token)).revision,action});
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
for(let i=0;i<8;i++) {
  const snapshot=await view(seatTokens[i]);
  assert.equal(snapshot.myHand.length,6);
  assert.equal(snapshot.speakerPool.length,i===speaker?4:0);
}
checks.push('Host and seven non-speakers cannot read the speaker opening pool');
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
let moves=0;
while ((host=await view(hostToken)).phase!=='complete') {
  assert.ok(moves<52);
  const player=await view(seatTokens[host.currentPlayer]);
  assert.ok(player.legalMoves.length>0);
  const next=player.legalMoves[0];
  const result=await act(seatTokens[host.currentPlayer],{type:'place',tileId:next.tileId,cellId:next.cellId},player.revision);
  assert.equal(result.status,200,JSON.stringify(result.data));
  moves++;
}
assert.equal(moves,52);
assert.equal(Object.keys(host.board).length,61);
assert.equal(new Set(Object.values(host.board)).size,61);
assert.ok(host.players.every(p=>p.handCount===0));
assert.equal(host.currentPlayer,null);
checks.push('A full 52-placement draft completes with 61 unique board tiles and empty hands');
const second = await request('/api/rooms',null,{title:'Invitation isolation verification',names:Array.from({length:8},(_,i)=>`Seat ${i+1}`),practice:false});
assert.equal(second.status,201);
assert.equal((await request(`/api/rooms/${second.data.room.id}`,seatTokens[0])).status,401);
const real = await request(`/api/rooms/${second.data.room.id}/actions`,second.data.hostToken,{expectedRevision:0,action:{type:'practice-fill'}});
assert.equal(real.status,400);
checks.push('Cross-room credentials are rejected; practice shortcuts unavailable in real drafts');
console.log(JSON.stringify({passed:checks,roomsCreated:[id,second.data.room.id],finalBoardTiles:Object.keys(host.board).length},null,2));
