import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const userToken = req.header('X-Token');
    if (!userToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authKey = `auth_${userToken}`;
    const userID = await redisClient.get(authKey);

    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await (await dbClient.usersCollection).findOne({ _id: ObjectId(userID) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name } = req.body;
    const { type } = req.body;
    const { data } = req.body;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const allowedTypes = ['file', 'folder', 'image'];
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const filesCollection = dbClient.db.collection('files');
      const parentidObject = new ObjectId(parentId);
      const existingFileWithParentId = await filesCollection.findOne(
        { _id: parentidObject, userId: user._id },
      );
      if (!existingFileWithParentId) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (existingFileWithParentId.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const filesCollection = dbClient.db.collection('files');
      const inserted = await filesCollection.insertOne(
        {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId,
        },
      );
      const id = inserted.insertedId;
      res.status(201).json({
        id, userID, name, type, isPublic, parentId,
      });
    } else {
      const filesCollection = dbClient.db.collection('files');
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const uuidstr = uuidv4();
      const parentidObject = new ObjectId(parentId);
      const filePath = `${folderPath}/${uuidstr}`;
      const buff = Buffer.from(data, 'base64');
      try {
        await fs.mkdir(folderPath);
      } catch (error) {
        // already exists
      }
      try {
        await fs.writeFile(filePath, buff, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      const inserted = await filesCollection.insertOne(
        {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentidObject,
          localPath: filePath,
        },
      );
      const fileId = inserted.insertedId;

      return res.status(201).json({
        id: fileId, userID, name, type, isPublic, parentId,
      });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
export default FilesController;
