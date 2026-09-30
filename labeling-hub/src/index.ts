import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { requireMachineAuth, requireMobileAuth, type HubBindings } from './auth.js';
import {
  leaseTasks,
  listAnnotationsSince,
  listBatches,
  openDb,
  storeAnnotations,
  upsertBatch,
} from './db.js';
import { seedDemoBatches } from './seed.js';
import type { AnnotationEvent, LabelBatch } from './types.js';

const port = Number(process.env.PORT ?? 8787);
const dbPath = process.env.LABELING_HUB_DB_PATH ?? './data/labeling-hub.db';
const bindings: HubBindings = {
  mobileToken: process.env.LABELING_HUB_MOBILE_TOKEN ?? 'dev-mobile-token',
  machineToken: process.env.LABELING_HUB_MACHINE_TOKEN ?? 'dev-machine-token',
};

openDb(dbPath);
const seeded = seedDemoBatches();
if (seeded) {
  console.log(
    `Ensured hub demo batches (new: ${seeded.experimentId}, ${seeded.tasks.length} tasks in that batch)`,
  );
}

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ ok: true, service: 'labeling-hub', version: '0.1.0' }));

const mobile = new Hono();
mobile.use('*', requireMobileAuth(bindings));

mobile.get('/batches', (c) => {
  return c.json({ batches: listBatches() });
});

mobile.post('/batches/:batchId/lease', async (c) => {
  const batchId = c.req.param('batchId');
  const body = (await c.req.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(body.limit ?? 100, 1), 500);
  const lease = leaseTasks(batchId, limit);
  if (!lease) {
    return c.json({ error: 'Batch not found' }, 404);
  }
  return c.json({
    batchId,
    assignmentId: lease.assignmentId,
    leaseExpiresAt: lease.leaseExpiresAt,
    tasks: lease.tasks,
  });
});

mobile.post('/annotations', async (c) => {
  const body = (await c.req.json()) as { annotations?: AnnotationEvent[] };
  const events = body.annotations ?? [];
  if (events.length === 0) {
    return c.json({ error: 'No annotations provided' }, 400);
  }
  const result = storeAnnotations(events);
  return c.json({ ok: true, ...result });
});

const machine = new Hono();
machine.use('*', requireMachineAuth(bindings));

machine.post('/batches', async (c) => {
  const batch = (await c.req.json()) as LabelBatch;
  if (!batch?.id || !Array.isArray(batch.tasks)) {
    return c.json({ error: 'Invalid batch payload' }, 400);
  }
  upsertBatch(batch);
  return c.json({ ok: true, batchId: batch.id, taskCount: batch.tasks.length });
});

machine.get('/annotations', (c) => {
  const since = c.req.query('since') ?? null;
  const annotations = listAnnotationsSince(since);
  const cursor =
    annotations.length > 0 ? annotations[annotations.length - 1].createdAt : since;
  return c.json({ annotations, cursor });
});

app.route('/v1/machine', machine);
app.route('/v1', mobile);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Labeling hub listening on http://localhost:${info.port}`);
  console.log('Mobile token default: dev-mobile-token (Authorization: Bearer ...)');
});
