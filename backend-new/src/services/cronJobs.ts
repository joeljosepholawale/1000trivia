import cron from 'node-cron';
import { gameModesManager } from './gameModesManager';

export function startCronJobs() {
  // Weekly reset for Free mode (every Sunday at midnight UTC)
  cron.schedule('0 0 * * 0', async () => {
    console.log('[CRON] Running weekly reset for Free mode...');
    try {
      const freeMode = await gameModesManager.getGameMode('free');
      if (freeMode) {
        const success = await gameModesManager.resetLeaderboard(freeMode.id);
        if (success) {
          console.log('[CRON] ✅ Free mode reset completed successfully');
        } else {
          console.error('[CRON] ❌ Free mode reset failed');
        }
      }
    } catch (error) {
      console.error('[CRON] Error during Free mode reset:', error);
    }
  });

  // Monthly reset for Challenge, Tournament, Super Tournament (1st of month at midnight UTC)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Running monthly reset for paid modes...');
    const modes = ['challenge', 'tournament', 'super_tournament'];
    
    for (const modeType of modes) {
      try {
        const gameMode = await gameModesManager.getGameMode(modeType);
        if (gameMode) {
          const success = await gameModesManager.resetLeaderboard(gameMode.id);
          if (success) {
            console.log(`[CRON] ✅ ${gameMode.display_name} reset completed successfully`);
          } else {
            console.error(`[CRON] ❌ ${gameMode.display_name} reset failed`);
          }
        }
      } catch (error) {
        console.error(`[CRON] Error during ${modeType} reset:`, error);
      }
    }
  });

  // Daily cleanup - archive old bank balance records (optional)
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running daily maintenance tasks...');
    // Add any daily maintenance tasks here
    console.log('[CRON] ✅ Daily maintenance completed');
  });

  console.log('[CRON] Cron jobs initialized:');
  console.log('  - Weekly Free mode reset: Every Sunday at 00:00 UTC');
  console.log('  - Monthly paid modes reset: 1st of month at 00:00 UTC');
  console.log('  - Daily maintenance: Every day at 02:00 UTC');
}

// Manual reset function for testing/admin use
export async function manualReset(modeType: string): Promise<boolean> {
  try {
    const gameMode = await gameModesManager.getGameMode(modeType);
    if (!gameMode) {
      console.error(`[MANUAL RESET] Game mode ${modeType} not found`);
      return false;
    }

    const success = await gameModesManager.resetLeaderboard(gameMode.id);
    if (success) {
      console.log(`[MANUAL RESET] ✅ ${gameMode.display_name} reset completed`);
    } else {
      console.error(`[MANUAL RESET] ❌ ${gameMode.display_name} reset failed`);
    }
    return success;
  } catch (error) {
    console.error(`[MANUAL RESET] Error:`, error);
    return false;
  }
}
