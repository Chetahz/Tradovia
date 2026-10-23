import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData, type Trade } from '../lib/domain.ts';
import {
  analyzeTradoviaEdge,
  EDGE_MIN_SAMPLE,
  tradeSession,
} from '../lib/tradovia-edge.ts';

void test('edge analysis requires a useful sample before ranking a pattern', () => {
  const source = demoData(new Date(2026, 8, 7)).trades[0];
  const trades = Array.from({ length: EDGE_MIN_SAMPLE - 1 }, (_, index) => ({
    ...source,
    id: `small-${index}`,
    setup: 'Small sample',
  }));
  const edge = analyzeTradoviaEdge(trades);
  assert.equal(edge.groups.some((group) => group.key === 'Small sample'), false);
  assert.equal(edge.strongest, undefined);
});

void test('edge analysis ranks normalized results and reports process coverage', () => {
  const source = demoData(new Date(2026, 8, 7)).trades[0];
  const make = (id: string, setup: string, r: number): Trade => ({
    ...source,
    id,
    setup,
    risk: 100,
    gross: r * 100,
    fees: 0,
    adherence: 'yes',
    review: {
      checklist: [],
      emotion: 'calm',
      lesson: '',
      completedAt: '2026-09-07T12:00:00.000Z',
    },
  });
  const trades = [
    ...Array.from({ length: 4 }, (_, index) => make(`a-${index}`, 'Setup A', 1)),
    ...Array.from({ length: 4 }, (_, index) => make(`b-${index}`, 'Setup B', -0.5)),
  ];
  const edge = analyzeTradoviaEdge(trades);
  assert.equal(edge.strongest?.key, 'Setup A');
  assert.equal(edge.strongest?.averageR, 1);
  assert.equal(edge.weakest?.key, 'Setup B');
  assert.equal(edge.reviewCoverage, 100);
  assert.equal(edge.riskCoverage, 100);
});

void test('session labels follow the stored trade time', () => {
  assert.equal(tradeSession('07:59'), 'asia');
  assert.equal(tradeSession('08:00'), 'london');
  assert.equal(tradeSession('13:00'), 'new-york');
  assert.equal(tradeSession('21:00'), 'late');
});
