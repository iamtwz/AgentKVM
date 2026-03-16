export class SerialQueue {
  private pending: Promise<void> = Promise.resolve();

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.pending = this.pending
      .then(() => fn().then(resolve, reject))
      .catch(() => {});

    return result;
  }
}
