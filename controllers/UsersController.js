#!/usr/bin/node
import sha1 from 'sha1';
import dbClient from '../utils/db';

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
      await dbClient.usersCollection).find({ email });
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
}

export default UsersController;
