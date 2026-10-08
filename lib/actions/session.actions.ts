'use server'

import { StartSessionResult } from "@/types"
import { connectToDatabase } from "@/database/mongoose";
import { getCurrentBillingPeriodStart, PLANS } from "../subscription-constants";
import { getCurrentUserPlan } from "../subscription.server";
import VoiceSession from "@/database/models/voice-session.model";
import { auth } from "@clerk/nextjs/server";

export const startVoiceSession = async (bookId: string): Promise<StartSessionResult> => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const plan = await getCurrentUserPlan();
        const limits = PLANS[plan];
        const billingPeriodStart = getCurrentBillingPeriodStart();
        const billingPeriodEnd = new Date(Date.UTC(
            billingPeriodStart.getUTCFullYear(),
            billingPeriodStart.getUTCMonth() + 1,
            1,
        ));

        await connectToDatabase();

        const currentCount = await VoiceSession.countDocuments({
            clerkId: userId,
            startedAt: { $gte: billingPeriodStart, $lt: billingPeriodEnd },
        });
        if (limits.maxSessionsPerMonth !== null && currentCount >= limits.maxSessionsPerMonth) {
            return {
                success: false,
                error: `Your ${plan} plan allows ${limits.maxSessionsPerMonth} voice sessions per calendar month. Upgrade your plan to continue.`,
                isBillingError: true,
            };
        }

        const session = await VoiceSession.create({
            clerkId: userId,
            bookId, 
            startedAt: new Date(),
            billingPeriodStart,
            durationSeconds: 0,
        })

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limits.maxSessionMinutes,
        }
    } catch (e) {
        console.error('Error starting voice session', e);
        return { success: false, error: 'Failed to start voice session. Please try again later.'}
    }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<{ success: boolean }> => {
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
        return { success: false };
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false };
        }

        await connectToDatabase();

        const session = await VoiceSession.findOneAndUpdate(
            { _id: sessionId, clerkId: userId },
            {
                $set: {
                    endedAt: new Date(),
                    durationSeconds,
                },
            },
            { new: true },
        );

        return { success: session !== null };
    } catch (e) {
        console.error('Error ending voice session', e);
        return { success: false };
    }
}