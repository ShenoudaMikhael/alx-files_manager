/* eslint-disable no-unused-vars */
/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

function getStatus(req, res) { /* eslint-disable no-unused-vars */
  res.status(200).json({
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  });
}

async function getStats(req, res) { /* eslint-disable no-unused-vars */
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  res.status(200).json({ users, files });
}

module.exports = { getStatus, getStats };
