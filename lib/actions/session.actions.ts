'use server'

import { StartSessionResult } from "@/types"
import { connectToDatabase } from "@/database/mongoose";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        const session = await VoiceSession.create({
            clerkId, 
            bookId, 
            startedAt: new Date(),
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        })

        return {
            success: true,
            sessionId: session._id.toString(),
            //maxDurationMinutes: check.maxDurationMinutes,
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
        await connectToDatabase();

        const session = await VoiceSession.findByIdAndUpdate(
            sessionId,
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