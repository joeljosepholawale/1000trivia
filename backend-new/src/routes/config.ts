import { Router } from 'express';
import { config } from '@1000ravier/shared';
import { db } from '../services/database';

const router = Router();

// GET /config - Get app configuration
router.get('/', async (req, res) => {
  try {
    const appConfig = config.getConfig();

    // Get active game modes and periods
    const gameModes = await db.getGameModes();
    const activePeriods = await db.getActivePeriods();

    res.json({
      success: true,
      data: {
        // Core configuration
        modes: appConfig.modes,
        credits: appConfig.credits,
        game: appConfig.game,
        app: appConfig.app,
        
        // Current active data
        activeModes: gameModes,
        activePeriods: activePeriods,
        
        // Client-safe payment config
        payments: {
          enableTestMode: appConfig.payments.enableTestMode,
          supportedCurrencies: appConfig.payments.supportedCurrencies,
          minimumPayoutAmount: appConfig.payments.minimumPayoutAmount
        },

        // Winner gating thresholds (for client logic)
        winnerGatingThresholds: appConfig.winnerGatingThresholds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get configuration'
      }
    });
  }
});

// GET /config/modes - Get available game modes
router.get('/modes', async (req, res) => {
  try {
    const modes = await db.getGameModes();
    
    res.json({
      success: true,
      data: modes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get game modes'
      }
    });
  }
});

// GET /config/periods - Get active periods
router.get('/periods', async (req, res) => {
  try {
    const periods = await db.getActivePeriods();
    
    res.json({
      success: true,
      data: periods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get active periods'
      }
    });
  }
});

// GET /config/credits - Get credits configuration
router.get('/credits', async (req, res) => {
  try {
    const creditsConfig = config.getConfig().credits;
    
    res.json({
      success: true,
      data: creditsConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get credits configuration'
      }
    });
  }
});

export default router;