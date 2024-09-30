#!/usr/bin/node
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) { /* eslint-disable no-unused-vars */
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  }

  static async getStats(req, res) { /* eslint-disable no-unused-vars */
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200).json({ users, files });
  }
}

export default AppController;
module.exports = AppController;
