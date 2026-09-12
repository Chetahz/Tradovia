import test from 'node:test';
import assert from 'node:assert/strict';
import {
  demoData,
  validateTrade,
  isTradeReviewed,
  planChecklist,
  net,
  type Playbook,
} from '../lib/domain.ts';
const plan: Playbook = {
  id: 'plan-test',
  name: 'Pullback',
  technique: 'PA',
  entry: 'Wait for confirmation',
  exit: '',
  risk: '',
  checklist: 'Wait for close\r\n\nRespect risk',
  archived: false,
  version: 1,
};

test('review survives persistence without changing imported execution, notes or images', () => {
  const base = {
    ...demoData().trades[0],
    status: 'CLOSED' as const,
    notes: 'Original broker note',
    imageIds: ['before-image', 'after-image'],
  };
  const saved = validateTrade({
    ...base,
    playbook: plan,
    adherence: 'partial',
    imageStages: { 'before-image': 'before', 'after-image': 'after' },
    review: {
      checklist: [
        { text: 'Wait for close', answer: 'no' },
        { text: 'Respect risk', answer: '' },
      ],
      emotion: 'anxious',
      lesson: 'Wait for confirmation.',
      completedAt: '2026-09-13T02:00:00.000Z',
    },
  });
  const restored = validateTrade(JSON.parse(JSON.stringify(saved)));
  assert.equal(net(restored), net(base));
  for (const key of [
    'entry',
    'sl',
    'tp',
    'lot',
    'risk',
    'fees',
    'gross',
    'date',
    'time',
    'notes',
  ] as const)
    assert.equal(restored[key], base[key]);
  assert.deepEqual(restored.imageIds, base.imageIds);
  assert.deepEqual(restored.review, saved.review);
  assert.equal(restored.review?.checklist[1].answer, '');
  assert.equal(restored.imageStages?.['after-image'], 'after');
  assert.equal(isTradeReviewed(restored), true);
  plan.version = 2;
  assert.equal(saved.playbook?.version, 1);
  plan.version = 1;
});

test('unreviewed, legacy, explicit no-plan and open trades have distinct review states', () => {
  const trade = { ...demoData().trades[0], status: 'CLOSED' as const };
  assert.equal(isTradeReviewed(trade), false);
  assert.equal(
    isTradeReviewed({ ...trade, playbook: plan, adherence: 'yes' }),
    true,
  );
  const reviewed = validateTrade({
    ...trade,
    adherence: 'no',
    review: {
      checklist: [],
      emotion: '',
      lesson: '',
      completedAt: '2026-09-13T02:00:00.000Z',
    },
  });
  assert.equal(isTradeReviewed(reviewed), true);
  assert.equal(isTradeReviewed({ ...reviewed, status: 'OPEN' }), false);
  assert.equal(
    isTradeReviewed({
      ...trade,
      review: { checklist: [], emotion: '', lesson: 'Draft' },
    }),
    false,
  );
});

test('checklist answers must belong to the saved plan and removed image labels are discarded', () => {
  const trade = demoData().trades[0];
  assert.equal(planChecklist(plan).length, 2);
  assert.throws(
    () =>
      validateTrade({
        ...trade,
        playbook: plan,
        review: {
          checklist: [{ text: 'Different rule', answer: 'yes' }],
          emotion: '',
          lesson: '',
        },
      }),
    /Invalid trade review/,
  );
  assert.throws(
    () =>
      validateTrade({
        ...trade,
        review: {
          checklist: [],
          emotion: '',
          lesson: '',
          completedAt: 'invalid',
        },
      }),
    /Invalid trade review/,
  );
  assert.deepEqual(
    validateTrade({
      ...trade,
      imageIds: [],
      imageStages: { removed: 'before' },
    }).imageStages,
    {},
  );
});
