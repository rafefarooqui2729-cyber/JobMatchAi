import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'jobmatch-ai-api',
  });
});

export default healthRouter;
