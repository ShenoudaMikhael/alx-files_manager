import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * Class representing a Redis client for caching and managing key-value pairs.
 */
class RedisClient {
  /**
   * Initializes the Redis client and sets up event listeners for connection status.
   * Sets the `isClientConnected` flag to monitor the client's connection to the server.
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;

    // Handle error events and update connection status
    this.client.on('error', (error) => {
      console.error('Redis client not connected to the server:', error.message);
      this.isClientConnected = false;
    });

    // Handle successful connection
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if the Redis client is connected to the server.
   *
   * @returns {boolean} - True if the client is connected, otherwise false.
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the value associated with the specified key from Redis.
   *
   * @param {string} key - The key for which the value should be retrieved.
   * @returns {Promise<string | null>} - A promise that resolves to the value of the key, or null if not found.
   */
  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  /**
   * Sets a value for the specified key in Redis with an expiration time.
   *
   * @param {string} key - The key to be set.
   * @param {string} value - The value to associate with the key.
   * @param {number} duration - The time-to-live (TTL) for the key in seconds.
   * @returns {Promise<void>} - A promise that resolves when the operation is complete.
   */
  async set(key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  /**
   * Deletes the specified key from Redis.
   *
   * @param {string} key - The key to be deleted.
   * @returns {Promise<void>} - A promise that resolves when the key is deleted.
   */
  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

// Export an instance of RedisClient for use throughout the application
const redisClient = new RedisClient();

export default redisClient;
