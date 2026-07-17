import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getDataSummary,
  purgeAllData,
  PURGE_CONFIRM_PHRASE
} from '../services/purgeAllData.js';
import { createDatabaseBackup } from '../services/databaseBackup.js';

const router = Router();

router.get('/data/summary', async (_req, res, next) => {
  try {
    const summary = await getDataSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

async function handlePurge(req, res, next) {
  try {
    const phrase = String(req.body?.confirmPhrase ?? '').trim();
    if (phrase !== PURGE_CONFIRM_PHRASE) {
      return res.status(400).json({
        error: 'Confirmation phrase required',
        requiredPhrase: PURGE_CONFIRM_PHRASE
      });
    }

    const result = await purgeAllData();
    res.json({
      success: true,
      message: 'All IMS database records were deleted.',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

// POST preferred — some clients/proxies mishandle DELETE with a JSON body.
router.post('/data/purge', handlePurge);
router.delete('/data', handlePurge);

router.post('/database/backup', requireAuth, async (req, res, next) => {
  try {
    const outputDirectory = String(req.body?.outputDirectory ?? '').trim();
    const fileName = String(req.body?.fileName ?? '').trim();
    if (!outputDirectory || !fileName) {
      return res.status(400).json({ error: 'outputDirectory and fileName are required.' });
    }

    const result = await createDatabaseBackup({
      outputDirectory,
      fileName,
      requestedBy: req.authUser?.username || req.authUser?.fullName || 'unknown'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
