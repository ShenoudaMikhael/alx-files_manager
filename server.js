import express from 'express';

import router from './routes/index';

const app = express();

app.use(express.json());
router(app);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
