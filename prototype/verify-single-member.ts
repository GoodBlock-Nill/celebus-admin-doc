import { mockMembers, getMemberGPChanges } from './src/mock/members';

// Verify a single member in detail (Member 2: carat_love12)
const member = mockMembers[2];
const entries = getMemberGPChanges(member.id);

console.log('=== Detailed Single Member Verification ===\n');
console.log(`Member: ${member.nickname} (${member.id})`);
console.log(`Current GP from member object: ${member.currentGP}\n`);

// Sort chronologically
const chronological = [...entries].sort((a, b) => 
  new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
);

console.log('=== First 5 Transactions (Chronological) ===');
chronological.slice(0, 5).forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.datetime.substring(0, 19)}`);
  console.log(`   Type: ${entry.type}, Amount: ${entry.amount > 0 ? '+' : ''}${entry.amount}, Balance After: ${entry.balanceAfter}`);
});

console.log('\n=== Last 5 Transactions (Most Recent) ===');
chronological.slice(-5).forEach((entry, i) => {
  const idx = chronological.length - 5 + i + 1;
  console.log(`${idx}. ${entry.datetime.substring(0, 19)}`);
  console.log(`   Type: ${entry.type}, Amount: ${entry.amount > 0 ? '+' : ''}${entry.amount}, Balance After: ${entry.balanceAfter}`);
});

// Calculate earned and used
const earned = entries
  .filter(c => ['REWARD', 'REFUND', 'EXCHANGE_IN', 'REFUND_CANCEL'].includes(c.type))
  .reduce((sum, c) => sum + Math.abs(c.amount), 0);

const used = entries
  .filter(c => ['PARTICIPATION', 'BOOSTING', 'EXCHANGE_OUT'].includes(c.type))
  .reduce((sum, c) => sum + Math.abs(c.amount), 0);

console.log('\n=== GP Summary Breakdown ===');
console.log(`Earned GP (REWARD + REFUND + EXCHANGE_IN + REFUND_CANCEL):`);
entries.filter(c => ['REWARD', 'REFUND', 'EXCHANGE_IN', 'REFUND_CANCEL'].includes(c.type))
  .forEach(c => console.log(`  ${c.type}: +${Math.abs(c.amount)}`));
console.log(`  Total Earned: ${earned} GP`);

console.log(`\nUsed GP (PARTICIPATION + BOOSTING + EXCHANGE_OUT):`);
entries.filter(c => ['PARTICIPATION', 'BOOSTING', 'EXCHANGE_OUT'].includes(c.type))
  .forEach(c => console.log(`  ${c.type}: -${Math.abs(c.amount)}`));
console.log(`  Total Used: ${used} GP`);

// Verify formula
const firstEntry = chronological[0];
const startBalance = firstEntry.balanceAfter - firstEntry.amount >= 0 
  ? firstEntry.balanceAfter - firstEntry.amount 
  : 0;

console.log('\n=== Formula Verification ===');
console.log(`Start Balance: ${startBalance}`);
console.log(`+ Earned:      ${earned}`);
console.log(`- Used:        ${used}`);
console.log(`= Expected:    ${startBalance + earned - used}`);
console.log(`= Actual:      ${member.currentGP}`);
console.log(`Match: ${startBalance + earned - used === member.currentGP ? '✅ YES' : '❌ NO'}`);

// Verify latest balanceAfter matches currentGP
const latestEntry = entries[0]; // DESC sorted in return
console.log(`\nLatest balanceAfter: ${latestEntry.balanceAfter}`);
console.log(`Current GP:          ${member.currentGP}`);
console.log(`Match: ${latestEntry.balanceAfter === member.currentGP ? '✅ YES' : '❌ NO'}`);
