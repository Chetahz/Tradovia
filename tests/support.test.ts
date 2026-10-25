import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateAdminTicketUpdate,
  validateNewTicket,
  validateTicketReply,
} from '../lib/support.ts';

await test('support ticket input is normalized', () => {
  assert.deepEqual(
    validateNewTicket({
      category: 'bug',
      subject: '  Import   fails ',
      message: '  The report   cannot be imported. ',
    }),
    {
      category: 'bug',
      subject: 'Import fails',
      message: 'The report cannot be imported.',
    },
  );
});
await test('incomplete support tickets are rejected', () => {
  assert.throws(() =>
    validateNewTicket({ category: 'unknown', subject: 'x', message: 'short' }),
  );
});
await test('member and admin support replies are validated', () => {
  const ticketId = '12345678-1234-1234-1234-123456789abc';
  assert.deepEqual(
    validateTicketReply({ ticketId, message: ' Please help ' }),
    { ticketId, message: 'Please help' },
  );
  assert.deepEqual(validateAdminTicketUpdate({ ticketId, action: 'resolve' }), {
    ticketId,
    action: 'resolve',
    message: '',
  });
  assert.throws(() =>
    validateAdminTicketUpdate({ ticketId, action: 'reply', message: '' }),
  );
});
