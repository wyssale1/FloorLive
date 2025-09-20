import { Router } from 'express';
import { backgroundEntityService } from '../services/backgroundEntityService.js';

const router = Router();

/**
 * Get entity queue status for debugging
 */
router.get('/queues', (req, res) => {
  try {
    const entityQueue = backgroundEntityService.getQueueStatus();

    res.json({
      timestamp: new Date().toISOString(),
      queues: {
        entityUpdates: {
          ...entityQueue,
          description: 'Handles entity data refresh and discovery'
        }
      },
      totalQueuedJobs: entityQueue.queueLength,
      totalRunningJobs: entityQueue.runningJobs,
      note: 'Image processing is now handled locally via npm scripts'
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;