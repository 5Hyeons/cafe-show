import { useChat, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Screen1 } from '../pages/Screen1';
import { ChatMessage } from '../types';
import { useCallback, useEffect, useState } from 'react';

interface LiveKitChatProps {
  onNextScreen?: () => void;
}

export function LiveKitChat({ onNextScreen }: LiveKitChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { chatMessages, send } = useChat();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  // Subscribe to Agent transcriptions (lk.transcription topic)
  useEffect(() => {
    if (!room) return;

    const handleTranscription = async (reader: any, participantIdentity: string) => {
      try {
        const isTranscription = reader.info?.attributes?.['lk.transcribed_track_id'];
        const isFinal = reader.info?.attributes?.['lk.transcription_final'] === 'true';
        const segmentId = reader.info?.attributes?.['lk.segment_id'];
        const streamId = reader.info.id;

        // Ignore non-transcriptions or own messages
        if (!isTranscription || participantIdentity === localParticipant.identity) {
          return;
        }

        // Process stream incrementally
        let fullText = '';
        for await (const chunk of reader) {
          fullText += chunk;

          // Update message in real-time
          setMessages((prev) => {
            const existingIndex = prev.findIndex(m => m.id === streamId);

            const updatedMessage: ChatMessage = {
              id: streamId,
              message: fullText + (isFinal ? '' : ' ...'),
              isUser: false,
              timestamp: reader.info.timestamp || Date.now(),
              sender: 'Agent',
            };

            if (existingIndex >= 0) {
              // Update existing message
              const newMessages = [...prev];
              newMessages[existingIndex] = updatedMessage;
              return newMessages;
            } else {
              // Add new message
              return [...prev, updatedMessage];
            }
          });
        }

        // Final update - remove "..." indicator
        if (isFinal) {
          setMessages((prev) => {
            const existingIndex = prev.findIndex(m => m.id === streamId);
            if (existingIndex >= 0) {
              const newMessages = [...prev];
              newMessages[existingIndex] = {
                ...newMessages[existingIndex],
                message: fullText,
              };
              return newMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('[LiveKit] Transcription error:', error);
      }
    };

    try {
      room.registerTextStreamHandler('lk.transcription', handleTranscription);
    } catch (error) {
      console.error('[LiveKit] Handler registration failed:', error);
    }
  }, [room, localParticipant.identity]);

  // Convert LiveKit chat messages to our format (user messages only)
  useEffect(() => {
    const userMessages: ChatMessage[] = chatMessages
      .filter((msg) => msg.from?.identity === localParticipant.identity)
      .map((msg) => ({
        id: msg.id || msg.timestamp.toString(),
        message: msg.message,
        isUser: true,
        timestamp: msg.timestamp,
        sender: 'You',
      }));

    // Merge with existing messages (keep Agent transcriptions)
    setMessages((prev) => {
      const agentMessages = prev.filter(m => !m.isUser);
      const combined = [...userMessages, ...agentMessages];
      return combined.sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [chatMessages, localParticipant.identity]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Send via LiveKit Chat (lk.chat topic)
    await send(text);
  }, [send]);

  return (
    <Screen1
      messages={messages}
      onSendMessage={handleSendMessage}
      onNextScreen={onNextScreen}
    />
  );
}
