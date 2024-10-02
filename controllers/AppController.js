import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_req, res) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    return res.status(200).json({ redis, db });
  }

  static async getStats(_req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    return res.status(200).json({ users, files });
  }
}

export default AppController;
