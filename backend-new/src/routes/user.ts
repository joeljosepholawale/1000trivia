/**
 * User Routes
 * API endpoints for user statistics, achievements, and profile
 */

import express from 'express';
import { authService } from '../services/auth';
import { userStatsService } from '../services/userStats';
import { db } from '../services/database';

const router = express.Router();

/**
 * GET /api/user/stats
 * Get comprehensive user statistics
 */
router.get('/stats', authService.authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const stats = await userStatsService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_FAILED',
        message: error.message || 'Failed to fetch user statistics',
      },
    });
  }
});

/**
 * GET /api/user/achievements
 * Get user achievements with progress
 */
router.get('/achievements', authService.authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const achievements = await userStatsService.getUserAchievements(userId);

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error: any) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACHIEVEMENTS_FETCH_FAILED',
        message: error.message || 'Failed to fetch user achievements',
      },
    });
  }
});

/**
 * GET /api/user/profile
 * Get complete user profile with stats
 */
router.get('/profile', authService.authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;
    
    const stats = await userStatsService.getUserStats(userId);
    const level = userStatsService.getUserLevel(stats.totalScore);
    const levelProgress = userStatsService.getLevelProgress(stats.totalScore);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username || user.email?.split('@')[0],
        created_at: user.created_at,
        email_verified: user.email_verified || false,
        level,
        ...levelProgress,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: error.message || 'Failed to fetch user profile',
      },
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile (username, avatar, bio, etc.)
 */
router.put('/profile', authService.authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { username, bio, avatar_url, language, timezone } = req.body;

    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USERNAME',
            message: 'Username must be at least 3 characters long',
          },
        });
      }

      // Check if username is already taken by another user
      const { data: existingUser } = await db.getClient()
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'Username is already taken',
          },
        });
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (username !== undefined) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (language !== undefined) updates.language = language;
    if (timezone !== undefined) updates.timezone = timezone;

    // Update user in database
    const { data: updatedUser, error: updateError } = await db.getClient()
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: error.message || 'Failed to update profile',
      },
    });
  }
});

export default router;
