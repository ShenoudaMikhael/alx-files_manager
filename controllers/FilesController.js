import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const dir = process.env.FOLDER_PATH || '/tmp/files_manager';

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
    const fileName = req.body.name;
    if (!fileName) return res.status(400).send({ error: 'Missing name' });

    const fileType = req.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

    const fileData = req.body.data;
    if (!fileData && fileType !== 'folder') return res.status(400).send({ error: 'Missing data' });

    const publicFile = req.body.isPublic || false;
    let parentId = req.body.parentId || 0;
    parentId = parentId === '0' ? 0 : parentId;
    if (parentId !== 0) {
      const parentFile = await (
        await dbClient.filesCollection).findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
    }

    const fileInsertData = {
      userId: user._id,
      name: fileName,
      type: fileType,
      isPublic: publicFile,
      parentId,
    };

    if (fileType === 'folder') {
      await (await dbClient.filesCollection).insertOne(fileInsertData);
      return res.status(201).send({
        id: fileInsertData._id,
        userId: fileInsertData.userId,
        name: fileInsertData.name,
        type: fileInsertData.type,
        isPublic: fileInsertData.isPublic,
        parentId: fileInsertData.parentId,
      });
    }

    const fileUid = uuidv4();

    const decData = Buffer.from(fileData, 'base64');
    const filePath = `${dir}/${fileUid}`;

    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    fs.writeFile(filePath, decData, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    fileInsertData.localPath = filePath;
    await (await dbClient.filesCollection).insertOne(fileInsertData);

    return res.status(201).send({
      id: fileInsertData._id,
      userId: fileInsertData.userId,
      name: fileInsertData.name,
      type: fileInsertData.type,
      isPublic: fileInsertData.isPublic,
      parentId: fileInsertData.parentId,
    });
  }
}
export default FilesController;
