#!/usr/bin/node
import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import UsersController from '../controllers/AuthController';
import UsersController from '../controllers/UserController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.post('/connect', AuthController.getConnect);
router.post('/disconnect', AuthController.getDisconnect);
router.post('/users/me', UserController.getMe);
export default router;
