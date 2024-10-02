#!/usr/bin/node
import MongoClient from 'mongodb';

class DBClient {
  constructor() {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${DB_HOST}:${DB_PORT}`;
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        // console.log('Connected successfully to server');
        this.db = client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.log(err.message);
        this.db = false;
      }
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const users = await this.usersCollection.countDocuments();
    return users;
  }

  async nbFiles() {
    const files = this.filesCollection.countDocuments();
    return files;
  }
}

const dbClient = new DBClient();
export default dbClient;
module.exports = dbClient;
