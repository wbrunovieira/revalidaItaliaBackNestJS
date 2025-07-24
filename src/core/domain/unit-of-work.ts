export interface IUnitOfWork {
  /**
   * Start a new transaction
   */
  start(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction
   * Automatically commits on success or rollbacks on failure
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}

export abstract class UnitOfWork implements IUnitOfWork {
  abstract start(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;

  async execute<T>(work: () => Promise<T>): Promise<T> {
    await this.start();

    try {
      const result = await work();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
