import { Router } from 'express';

const router = Router();

/**
 * Basic debug info endpoint
 */
router.get('/info', (req, res) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      status: 'Backend simplified - background processing removed',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      note: 'Background entity processing has been simplified for better maintainability'
    });
  } catch (error) {
    console.error('Error getting debug info:', error);
    res.status(500).json({
      error: 'Failed to get debug info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;