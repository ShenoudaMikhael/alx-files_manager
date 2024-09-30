#!/usr/bin/node
const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body ? req.body : { email: null, password: null };
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const dbUser = await (
      await dbClient.usersCollection).findOne({ email });
    if (dbUser) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const newUser = await (
      await dbClient.usersCollection).insertOne({ email, password: sha1(password) });
    const userId = newUser.insertedId.toString();
    return res.status(201).json({
      email, id: userId,
    });
  }

  static async getMe(request, response) {
    try {
      const userToken = request.header('X-Token');
      const authKey = `auth_${userToken}`;
      const userID = await redisClient.get(authKey);

      if (!userID) {
        response.status(401).json({ error: 'Unauthorized' });
      }
      const user = await (await dbClient.usersCollection).findOne({ _id: ObjectId(userID) });
      response.json({ id: user._id, email: user.email });
    } catch (error) {
      console.log(error);
      response.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
module.exports = UsersController;
