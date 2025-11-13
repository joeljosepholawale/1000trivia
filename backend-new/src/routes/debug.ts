import { Router } from 'express';
import { authService } from '../services/auth';
import { db } from '../services/database';

const router = Router();

// DELETE /debug/my-sessions - Delete all my game sessions (for testing)
router.delete('/my-sessions', authService.authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Delete in correct order (foreign key constraints)
    await db.getClient().from('answers').delete().eq('session_id', db.getClient()
      .from('game_sessions').select('id').eq('user_id', user.id));
    
    await db.getClient().from('session_questions').delete().eq('session_id', db.getClient()
      .from('game_sessions').select('id').eq('user_id', user.id));
    
    await db.getClient().from('leaderboard_entries').delete().eq('user_id', user.id);
    
    const { data, error } = await db.getClient()
      .from('game_sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All your game sessions deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete sessions'
      }
    });
  }
});

export default router;
