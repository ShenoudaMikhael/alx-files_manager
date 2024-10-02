import fs from 'fs';
import Bull from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import DBClient from './utils/db';

const thumbq = new Bull('fileQueue');

const createImageThumbnail = async (path, options) => {
  try {
    const thumbnail = await imageThumbnail(path, options);
    const pathNail = `${path}_${options.width}`;

    await fs.writeFileSync(pathNail, thumbnail);
  } catch (error) {
    console.log(error);
  }
};

thumbq.process(async (job) => {
  const { fileId } = job.data;
  if (!fileId) throw Error('Missing fileId');

  const { userId } = job.data;
  if (!userId) throw Error('Missing userId');

  const fileDocument = await DBClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!fileDocument) throw Error('File not found');

  createImageThumbnail(fileDocument.localPath, { width: 500 });
  createImageThumbnail(fileDocument.localPath, { width: 250 });
  createImageThumbnail(fileDocument.localPath, { width: 100 });
});
