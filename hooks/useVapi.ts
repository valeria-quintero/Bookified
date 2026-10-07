import { startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Vapi from '@vapi-ai/web'

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

const useLatestRef = <T>(value: T) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
};

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

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const[duration, setDuration] = useState(0);
    const[limitError, setLimitError] = useState<string | null>(null);

    const timeRef = useRef<NodeJS.Timeout | null>(null);
    const startTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);

    const bookRef = useLatestRef(book);
    const durationRef = useLatestRef(duration);
    const voice = book.persona || DEFAULT_VOICE;

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
                } else {
                    setStatus('speaking');
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
            setStatus(isUser ? 'thinking' : 'listening');
        };
        const handleCallStart = () => setStatus('listening');
        const handleCallEnd = () => {
            isStoppingRef.current = false;
            setCurrentMessage('');
            setCurrentUserMessage('');
            setStatus('idle');
        };

        vapiInstance.on('message', handleMessage);
        vapiInstance.on('call-start', handleCallStart);
        vapiInstance.on('call-end', handleCallEnd);

        return () => {
            vapiInstance.removeListener('message', handleMessage);
            vapiInstance.removeListener('call-start', handleCallStart);
            vapiInstance.removeListener('call-end', handleCallEnd);
        };
    }, []);
    
    const isActive = status === 'listening' || status === 'thinking' || status === 'speaking' || status === 'starting';

    //* Limits:
    // const maxDurationRef = useLatestRef(limits.maxSesionMinutes * 60)
    // const maxDurationSeconds
    // const remainingSeconds
    // const showTimeWarnings

    const start = async () => {
        if(!userId) return setLimitError('Please login to start a conversation');

        setLimitError(null);
        setStatus('connecting');

        try {
            const result = await startVoiceSession(userId, book._id);
            if(!result.success) {
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan')
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;

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
            setStatus('idle');
            setLimitError('An error occurred while starting the call');
        }
    }
    const stop = async () => {
        isStoppingRef.current = true;
        await getVapi().stop();
    }
    const clearErrors = async () => {}

    return {
        status, isActive, messages, currentMessage, currentUserMessage, duration, start, stop, clearErrors,
        // maxDurationSeconds, remainingSeconds, showTimeWarning
    }    
}

export default useVapi;