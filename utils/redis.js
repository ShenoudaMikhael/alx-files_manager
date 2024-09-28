#!/usr/bin/node
const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient({
      host: 'localhost',
      port: 6379,
    });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect();
    this.client.on('connection', () => {
      console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value);
    await this.client.expire(key, duration);
  }

  async del(key) {
    await this.client.del(key);
  }
}
export default new RedisClient();
