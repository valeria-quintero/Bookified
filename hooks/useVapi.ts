import { endVoiceSession, startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Vapi from '@vapi-ai/web'

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY

let vapi: InstanceType<typeof Vapi>

type TranscriptEvent = {
    type: 'transcript' | "transcript[transcriptType='final']";
    role: 'user' | 'assistant';
    transcriptType: 'partial' | 'final';
    transcript: string;
};

const isTranscriptEvent = (message: unknown): message is TranscriptEvent => {
    if (!message || typeof message !== 'object') return false;

    const event = message as Record<string, unknown>;
    return (
        (event.type === 'transcript' || event.type === "transcript[transcriptType='final']") &&
        (event.role === 'user' || event.role === 'assistant') &&
        (event.transcriptType === 'partial' || event.transcriptType === 'final') &&
        typeof event.transcript === 'string'
    );
};

function getVapi(){
    if(!vapi) {
        if(!VAPI_API_KEY) {
            throw new Error('VAPI API KEY not found. Please set it in the .env file.')
        }
        vapi = new Vapi(VAPI_API_KEY);
    }
    return vapi;
}

export const useVapi = (book: Pick<IBook, "persona" | "title" | "author" | "_id">) => {
    const { userId } = useAuth();
    const router = useRouter();

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [maxDurationMinutes, setMaxDurationMinutes] = useState<number | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);
    const assistantIsSpeakingRef = useRef(false);
    const sessionStartedAtRef = useRef<number | null>(null);
    const maxDurationSecondsRef = useRef(0);

    useEffect(() => {
        if (!VAPI_API_KEY) return;

        const vapiInstance = getVapi();
        const handleMessage = (message: unknown) => {
            if (!isTranscriptEvent(message)) return;

            const { role, transcript, transcriptType } = message;
            const isUser = role === 'user';
            const setCurrentTranscript = isUser
                ? setCurrentUserMessage
                : setCurrentMessage;

            if (transcriptType === 'partial') {
                setCurrentTranscript(transcript);
                if (isUser) {
                    setStatus('listening');
                } else if (!assistantIsSpeakingRef.current) {
                    setStatus('thinking');
                }
                return;
            }

            setCurrentTranscript('');
            setMessages((currentMessages) => {
                const lastMessage = currentMessages[currentMessages.length - 1];
                if (
                    lastMessage?.role === role &&
                    lastMessage.content === transcript
                ) {
                    return currentMessages;
                }

                return [...currentMessages, { role, content: transcript }];
            });
            if (isUser) {
                setStatus('thinking');
            } else if (!assistantIsSpeakingRef.current) {
                setStatus('listening');
            }
        };
        const handleSpeechStart = () => {
            if (sessionStartedAtRef.current === null) return;

            assistantIsSpeakingRef.current = true;
            setStatus('speaking');
        };
        const handleSpeechEnd = () => {
            if (sessionStartedAtRef.current === null) return;

            assistantIsSpeakingRef.current = false;
            setStatus('listening');
        };
        const handleCallStart = () => {
            sessionStartedAtRef.current = Date.now();
            assistantIsSpeakingRef.current = false;
            setStatus('listening');
            if (timeRef.current) clearInterval(timeRef.current);
            timeRef.current = setInterval(() => {
                const startedAt = sessionStartedAtRef.current;
                if (startedAt === null) return;

                const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
                setDuration(Math.min(elapsedSeconds, maxDurationSecondsRef.current));
                if (elapsedSeconds >= maxDurationSecondsRef.current && !isStoppingRef.current) {
                    isStoppingRef.current = true;
                    setDuration(maxDurationSecondsRef.current);
                    void vapiInstance.stop().catch((error: unknown) => {
                        console.error("Error stopping voice session at its plan limit:", error);
                    }).finally(() => {
                        router.replace("/");
                    });
                }
            }, 1000);
        };
        const handleCallEnd = () => {
            if (timeRef.current) {
                clearInterval(timeRef.current);
                timeRef.current = null;
            }
            const startedAt = sessionStartedAtRef.current;
            const finalDuration = startedAt === null
                ? 0
                : Math.min(
                    Math.floor((Date.now() - startedAt) / 1000),
                    maxDurationSecondsRef.current,
                );
            setDuration(finalDuration);
            sessionStartedAtRef.current = null;

            const sessionId = sessionIdRef.current;
            sessionIdRef.current = null;
            if (sessionId) {
                void endVoiceSession(sessionId, finalDuration).then((result) => {
                    if (!result.success) {
                        console.error("Could not save voice session duration");
                    }
                }).catch((error: unknown) => {
                    console.error("Error saving voice session duration:", error);
                });
            }

            isStoppingRef.current = false;
            assistantIsSpeakingRef.current = false;
            setCurrentMessage('');
            setCurrentUserMessage('');
            setStatus('idle');
        };

        vapiInstance.on('message', handleMessage);
        vapiInstance.on('speech-start', handleSpeechStart);
        vapiInstance.on('speech-end', handleSpeechEnd);
        vapiInstance.on('call-start', handleCallStart);
        vapiInstance.on('call-end', handleCallEnd);

        return () => {
            if (timeRef.current) clearInterval(timeRef.current);
            vapiInstance.removeListener('message', handleMessage);
            vapiInstance.removeListener('speech-start', handleSpeechStart);
            vapiInstance.removeListener('speech-end', handleSpeechEnd);
            vapiInstance.removeListener('call-start', handleCallStart);
            vapiInstance.removeListener('call-end', handleCallEnd);
        };
    }, [router]);
    
    const isActive = status === 'listening' || status === 'thinking' || status === 'speaking' || status === 'starting';

    const start = async () => {
        if(!userId) return setLimitError('Please login to start a conversation');

        setLimitError(null);
        setStatus('connecting');

        try {
            const result = await startVoiceSession(book._id);
            if(!result.success) {
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan')
                setStatus('idle');
                return;
            }

            if (!result.sessionId || !Number.isFinite(result.maxDurationMinutes) || result.maxDurationMinutes <= 0) {
                throw new Error("The server did not return the voice session limits");
            }
            sessionIdRef.current = result.sessionId;
            setDuration(0);
            setMaxDurationMinutes(result.maxDurationMinutes);
            maxDurationSecondsRef.current = result.maxDurationMinutes * 60;

            const firstMessage = `Hey, good to meet you. Quick question, before we dive in: have you actually read ${book.title} yet? Or are we starting fresh?`

            await getVapi().start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                },
                // voice: {
                //     provider: 'Vapi' as const,
                //     voiceId: getVoice(voice).id,
                //     model: "v2" as const,
                //     stability: 
                // }
            })
        } catch (e) {
            console.error('Error starting call', e);
            const sessionId = sessionIdRef.current;
            sessionIdRef.current = null;
            if (sessionId) {
                try {
                    const result = await endVoiceSession(sessionId, 0);
                    if (!result.success) {
                        console.error("Could not close the voice session after startup failed");
                    }
                } catch (endError) {
                    console.error("Error closing the voice session after startup failed:", endError);
                }
            }
            setStatus('idle');
            setLimitError('An error occurred while starting the call');
        }
    }
    const stop = async () => {
        isStoppingRef.current = true;
        try {
            await getVapi().stop();
        } catch (error) {
            console.error('Error stopping call', error);
            isStoppingRef.current = false;
            setLimitError('An error occurred while stopping the call');
        }
    }
    const clearErrors = () => setLimitError(null)

    return {
        status, isActive, messages, currentMessage, currentUserMessage, duration,
        maxDurationMinutes, limitError, start, stop, clearErrors,
    }    
}

export default useVapi;