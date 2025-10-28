/**
 * Referral Program Utilities
 * Generate referral codes, validate, and track usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid/non-secure';

const REFERRAL_CODE_KEY = '@referral_code';
const REFERRAL_USED_KEY = '@referral_used';
const REFERRAL_REWARDS_KEY = '@referral_rewards';

export interface ReferralReward {
  id: string;
  type: 'credits' | 'booster' | 'cosmetic';
  amount?: number;
  description: string;
  grantedAt: number;
}

export interface ReferralStatus {
  myCode: string | null;
  usedCode: string | null;
  rewards: ReferralReward[];
}

/**
 * Generate or fetch the user's referral code
 */
export async function getOrCreateReferralCode(prefix: string = 'RAV'): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (existing) return existing;

    const code = `${prefix}-${nanoid(8).toUpperCase()}`;
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
    return code;
  } catch (e) {
    console.error('Error creating referral code', e);
    // Fallback random
    const code = `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
    return code;
  }
}

/**
 * Use a referral code from another user (only once)
 */
export async function useReferralCode(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const alreadyUsed = await AsyncStorage.getItem(REFERRAL_USED_KEY);
    if (alreadyUsed) {
      return { ok: false, error: 'Bereits einen Code verwendet.' };
    }

    const myCode = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (myCode && myCode === code) {
      return { ok: false, error: 'Du kannst deinen eigenen Code nicht verwenden.' };
    }

    if (!/^\w{3,5}-[A-Z0-9]{6,10}$/.test(code)) {
      return { ok: false, error: 'Ungültiger Code.' };
    }

    // TODO: Validate with backend service if available
    await AsyncStorage.setItem(REFERRAL_USED_KEY, code);

    // Grant rewards to both inviter and invitee via backend in real app
    await grantReward({ type: 'credits', amount: 100, description: 'Referral Bonus' });

    return { ok: true };
  } catch (e) {
    console.error('Error using referral code', e);
    return { ok: false, error: 'Fehler beim Verwenden des Codes.' };
  }
}

export async function grantReward(reward: Omit<ReferralReward, 'id' | 'grantedAt'>) {
  const existingRaw = await AsyncStorage.getItem(REFERRAL_REWARDS_KEY);
  const existing: ReferralReward[] = existingRaw ? JSON.parse(existingRaw) : [];
  const entry: ReferralReward = {
    id: `rw_${Date.now()}`,
    grantedAt: Date.now(),
    ...reward,
  };
  existing.push(entry);
  await AsyncStorage.setItem(REFERRAL_REWARDS_KEY, JSON.stringify(existing));
  return entry;
}

export async function getReferralStatus(): Promise<ReferralStatus> {
  const [myCode, usedCode, rewardsRaw] = await Promise.all([
    AsyncStorage.getItem(REFERRAL_CODE_KEY),
    AsyncStorage.getItem(REFERRAL_USED_KEY),
    AsyncStorage.getItem(REFERRAL_REWARDS_KEY),
  ]);

  return {
    myCode,
    usedCode,
    rewards: rewardsRaw ? JSON.parse(rewardsRaw) : [],
  };
}

export async function resetReferralData() {
  await AsyncStorage.multiRemove([
    REFERRAL_CODE_KEY,
    REFERRAL_USED_KEY,
    REFERRAL_REWARDS_KEY,
  ]);
}
