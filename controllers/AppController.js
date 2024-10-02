import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_req, res) {
    try {
      const redis = redisClient.isAlive();
      const db = dbClient.isAlive();
      return res.status(200).json({ redis, db });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server Error' });
    }
  }

  static async getStats(_req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      return res.status(200).json({ users, files });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server Error' });
    }
  }
}

export default AppController;
