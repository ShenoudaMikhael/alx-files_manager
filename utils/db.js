import { MongoClient } from 'mongodb';

const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 27017;
const DEFAULT_DB_DATABASE = 'files_manager';

/**
 * Class representing a MongoDB client for managing file and user data.
 */
class DBClient {
  /**
   * Initializes the database connection with the provided host, port, and database name.
   * If no environment variables are set for these values, default values are used.
   */
  constructor() {
    const host = process.env.DB_HOST || DEFAULT_DB_HOST;
    const port = process.env.DB_PORT || DEFAULT_DB_PORT;
    const database = process.env.DB_DATABASE || DEFAULT_DB_DATABASE;

    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.isClientConnected = false;

    // Attempt to connect to the MongoDB client
    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB connection failed:', err.message || err.toString());
        this.isClientConnected = false;
      } else {
        console.log('MongoDB connection established.');
        this.isClientConnected = true;
      }
    });
  }

  /**
   * Checks if the MongoDB client is connected.
   *
   * @returns {boolean} - True if the client is connected, otherwise false.
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the number of users in the 'users' collection.
   *
   * @returns {Promise<number>} - A promise that resolves to the number of users.
   */
  async nbUsers() {
    const collection = this.client.db().collection('users');
    const count = await collection.countDocuments();
    return count;
  }

  /**
   * Retrieves the number of files in the 'files' collection.
   *
   * @returns {Promise<number>} - A promise that resolves to the number of files.
   */
  async nbFiles() {
    const collection = this.client.db().collection('files');
    const count = await collection.countDocuments();
    return count;
  }
}

// Export an instance of the DBClient class for use in other parts of the application
const dbClient = new DBClient();
export default dbClient;
