import { describe, it, expect } from 'vitest';
import { SerialQueue } from '../src/server/queue.js';

describe('SerialQueue', () => {
  it('should execute a single task', async () => {
    const queue = new SerialQueue();
    const result = await queue.enqueue(async () => 42);
    expect(result).toBe(42);
  });

  it('should execute tasks sequentially', async () => {
    const queue = new SerialQueue();
    const order: number[] = [];

    const p1 = queue.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
      return 'first';
    });

    const p2 = queue.enqueue(async () => {
      order.push(2);
      return 'second';
    });

    const p3 = queue.enqueue(async () => {
      order.push(3);
      return 'third';
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toBe('first');
    expect(r2).toBe('second');
    expect(r3).toBe('third');
    expect(order).toEqual([1, 2, 3]);
  });

  it('should continue after a failed task', async () => {
    const queue = new SerialQueue();

    const p1 = queue.enqueue(async () => {
      throw new Error('fail');
    }).catch((e: Error) => e.message);

    const p2 = queue.enqueue(async () => 'success');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe('fail');
    expect(r2).toBe('success');
  });

  it('should handle rapid concurrent enqueues', async () => {
    const queue = new SerialQueue();
    const results: number[] = [];

    const promises = Array.from({ length: 10 }, (_, i) =>
      queue.enqueue(async () => {
        results.push(i);
        return i;
      })
    );

    const returned = await Promise.all(promises);

    expect(returned).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
