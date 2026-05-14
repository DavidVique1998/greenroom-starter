import { getFlaggedSettlements } from '../lib/queries';
import { createClient } from '@libsql/client';

const results = await getFlaggedSettlements();
console.log('Flagged count:', results.length);
const flaggedIds = results.map(r => r.settlement.id);

const client = createClient({ url: 'file:./data/greenroom.db' });
const all = await client.execute("SELECT id FROM settlements WHERE status = 'disputed'");
const allIds = all.rows.map(r => r.id as string);
const missing = allIds.filter(id => !flaggedIds.includes(id));
console.log('Missing from flagged results:', missing);
client.close();
