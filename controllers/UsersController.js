#!/usr/bin/node
import bcrypt from 'bcrypt';
import dbClient from '../utils/db';

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
    }
    const dbUser = dbClient.usersCollection.find({ email });
    if (dbUser) {
      res.status(400).send({ error: 'Already exist' });
    }
    const hashedPass = bcrypt.hash(password);
    const newUser = dbClient.usersCollection.insert({ email, password: hashedPass });
    res.status(201).json({
      email: newUser.email, id: newUser.id,
    });
  }
}

export default UsersController;
