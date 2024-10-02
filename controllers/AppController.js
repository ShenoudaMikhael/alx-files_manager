import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(_req, res) {
    try {
      const redisStatus = redisClient.isAlive();
      const dbStatus = dbClient.isAlive();
      return res.status(200).json({ redis: redisStatus, db: dbStatus });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server Error' });
    }
  }

  static async getStats(_req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();
      return res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server Error' });
    }
  }
}

export default AppController;
