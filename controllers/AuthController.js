#!/usr/bin/node
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-named-as-default */
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (typeof (authHeader) !== 'string') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (authHeader.slice(0, 6) !== 'Basic ') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    if (!email || !password) { return res.status(401).send({ error: 'Unauthorized' }); }
    const hashedPassword = sha1(password);
    const usersCollection = await dbClient.usersCollection;
    const user = await usersCollection.findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

export default AuthController;
