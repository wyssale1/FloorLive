/**
 * Request batcher to avoid duplicate API calls when multiple requests
 * for the same resource come in simultaneously
 */
export class RequestBatcher {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Execute a request with deduplication
   * If the same key is requested while a previous request is pending,
   * return the same promise instead of making a new request
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if we already have a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create and store the request promise
    const promise = this.createDedupedRequest(key, requestFn);
    this.pendingRequests.set(key, promise);

    return promise;
  }

  private async createDedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    try {
      const result = await requestFn();
      return result;
    } finally {
      // Clean up the pending request once it's done
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get stats about pending requests
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    };
  }
}

// Global request batcher instance
export const requestBatcher = new RequestBatcher();