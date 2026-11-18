const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.tour.count(),
  p.tour.count({ where: { status: 'ACTIVE' } }),
  p.tour.count({ where: { status: 'PUBLISHED' } }),
  p.tour.count({ where: { status: 'DRAFT' } }),
  p.tour.count({ where: { status: 'INACTIVE' } }),
  p.destination.count(),
  p.destination.findMany({ select: { id: true, slug: true, name: true } }),
  p.tour.findMany({ where: { status: { in: ['ACTIVE','PUBLISHED'] } }, select: { id: true, slug: true, status: true, basePriceUSD: true } })
]).then(([t,a,pub,d,i,destCount,dests,activeTours]) => {
  console.log('=== DB STATE ===');
  console.log('Total tours:', t, '| ACTIVE:', a, '| PUBLISHED:', pub, '| DRAFT:', d, '| INACTIVE:', i);
  console.log('\nDestinations (' + destCount + '):');
  dests.forEach(dest => console.log(' -', dest.slug, '|', dest.id));
  console.log('\nActive/Published Tours (' + activeTours.length + '):');
  activeTours.forEach(t => console.log(' -', t.slug, '|', t.status, '| $'+t.basePriceUSD));
  return p.$disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
