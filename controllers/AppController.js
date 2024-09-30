import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Controller class for handling the app's status and statistics.
 */
class AppController {
  /**
   * Returns the status of Redis and the database.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Object} - JSON response with the status of Redis and database.
   */
  static async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    return res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  /**
   * Returns the number of users and files in the database.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Object} - JSON response with the count of users and files.
   */
  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    return res.status(200).json({ users: usersCount, files: filesCount });
  }
}

export default AppController;
