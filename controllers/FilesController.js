import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
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

  static async getShow(req, res) {
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
    const fileId = req.params.id || '';
    const file = await (
      await dbClient.filesCollection).findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
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
    let parentId = req.query.parentId || 0;
    if (parentId === '0') parentId = 0;
    if (parentId !== 0) {
      parentId = ObjectId(parentId);

      const folder = await (await dbClient.filesCollection).findOne({ _id: ObjectId(parentId) });
      if (!folder || folder.type !== 'folder') return res.status(200).send([]);
    }
    const page = req.query.page || 0;
    const matchCr = { $and: [{ parentId }] };
    let cuurentPageData = [{ $match: matchCr }, { $skip: page * 20 }, { $limit: 20 }];
    if (parentId === 0) cuurentPageData = [{ $skip: page * 20 }, { $limit: 20 }];

    const pageFiles = await (await dbClient.filesCollection).aggregate(cuurentPageData);
    const files = [];

    await pageFiles.forEach((file) => {
      const fileObj = {
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      };
      files.push(fileObj);
    });
    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
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
    const fileId = req.params.id || '';

    let file = await (await dbClient.filesCollection).findOne(
      { _id: ObjectId(fileId), userId: user._id },
    );
    if (!file) return res.status(404).send({ error: 'Not found' });

    await (
      await dbClient.filesCollection).updateOne(
      { _id: ObjectId(fileId) }, { $set: { isPublic: true } },
    );
    file = await (
      await dbClient.filesCollection).findOne({ _id: ObjectId(fileId), userId: user._id });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
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
    const fileId = req.params.id || '';

    let file = await (
      await dbClient.filesCollection).findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await (
      await dbClient.filesCollection).updateOne(
      { _id: ObjectId(fileId) }, { $set: { isPublic: false } },
    );
    file = await (
      await dbClient.filesCollection).findOne({ _id: ObjectId(fileId), userId: user._id });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
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

    const fileId = req.params.id || '';
    const size = req.query.size || 0;

    const file = await (await dbClient.filesCollection).findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    const { isPublic, userId, type } = file;

    if ((!isPublic && !user) || (user && userId.toString() !== user && !isPublic)) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (type === 'folder') return res.status(400).send({ error: 'A folder doesn\'t have content' });

    const path = size === 0 ? file.localPath : `${file.localPath}_${size}`;

    try {
      const fileData = fs.readFileSync(path);
      const mimeType = mime.contentType(file.name);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(fileData);
    } catch (err) {
      return res.status(404).send({ error: 'Not found' });
    }
  }
}
