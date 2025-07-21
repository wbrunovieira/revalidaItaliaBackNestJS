// src/core/criteria/base-criteria.ts

/**
 * Base class for implementing the Criteria Pattern
 * 
 * Provides a fluent interface for building complex queries
 * that can be translated to different persistence mechanisms
 */
export abstract class BaseCriteria<T> {
  protected conditions: any[] = [];
  protected orderByField?: { field: string; direction: 'asc' | 'desc' };
  protected paginationConfig?: { skip: number; take: number };

  /**
   * Builds the final query object
   * This should be implemented by concrete criteria classes
   */
  abstract build(): any;

  /**
   * Adds ordering to the criteria
   */
  protected orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByField = { field, direction };
    return this;
  }

  /**
   * Adds pagination to the criteria
   */
  protected paginate(page: number, pageSize: number): this {
    this.paginationConfig = {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
    return this;
  }

  /**
   * Combines conditions with AND logic
   */
  protected and(...conditions: any[]): any {
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { AND: conditions };
  }

  /**
   * Combines conditions with OR logic
   */
  protected or(...conditions: any[]): any {
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { OR: conditions };
  }
}