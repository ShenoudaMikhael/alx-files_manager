#!/usr/bin/node
import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = Router();

const routeController = (app) => {
  app.use('/', router);
  router.get('/status', AppController.getStatus);
  router.get('/stats', AppController.getStats);
  router.post('/users', UsersController.postNew);
};

export default routeController;
