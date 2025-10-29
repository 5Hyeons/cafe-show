import { useChat, useLocalParticipant, useRoomContext, useTracks, AudioTrack, useConnectionState } from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import { ChatView } from '../pages/ChatView';
import { ChatMessage } from '../types';
import { useCallback, useEffect, useState } from 'react';
import { useAudioContext } from '../hooks/useAudioContext';

interface LiveKitChatProps {
  onNextScreen?: () => void;
}

export function LiveKitChat({ onNextScreen }: LiveKitChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { chatMessages, send } = useChat();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const connectionState = useConnectionState();

  // Auto-resume AudioContext on user interaction (fix browser autoplay policy)
  useAudioContext();

  // Subscribe to agent audio tracks
  const audioTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ], {
    onlySubscribed: true,
  });

  // Disable microphone in ChatView (text-only chat)
  // Only after connection is established to ensure it takes effect
  useEffect(() => {
    if (localParticipant && connectionState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(false);
      console.log('[LiveKitChat] Microphone disabled for ChatView (connection established)');
    }

    // Cleanup: disable mic when unmounting
    return () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false);
        console.log('[LiveKitChat] Microphone disabled on unmount');
      }
    };
  }, [localParticipant, connectionState]);

  // Subscribe to Agent transcriptions (lk.transcription topic)
  useEffect(() => {
    if (!room) return;

    const handleTranscription = async (reader: any, participantIdentity: string) => {
      try {
        const isTranscription = reader.info?.attributes?.['lk.transcribed_track_id'];
        const isFinal = reader.info?.attributes?.['lk.transcription_final'] === 'true';
        const segmentId = reader.info?.attributes?.['lk.segment_id'];
        const streamId = reader.info.id;

        // Ignore non-transcriptions
        if (!isTranscription) {
          return;
        }

        // Extract identity string from participantIdentity (can be object or string)
        const participantId = typeof participantIdentity === 'string'
          ? participantIdentity
          : participantIdentity?.identity;

        // Determine if this is user or agent transcription
        const isUserTranscription = participantId === localParticipant.identity;

        // Debug: Only log final transcriptions to reduce noise
        if (isFinal) {
          console.log('[LiveKitChat] Transcription final:', {
            segmentId,
            participantId,
            isUserTranscription,
            text: '(will be processed)',
          });
        }

        // Use segmentId for message ID (same segment = same message)
        const messageId = segmentId || streamId;

        // Process stream incrementally
        let fullText = '';
        for await (const chunk of reader) {
          fullText += chunk;

          // Update message in real-time
          setMessages((prev) => {
            const existingIndex = prev.findIndex(m => m.id === messageId);

            const updatedMessage: ChatMessage = {
              id: messageId,
              message: fullText + (isFinal ? '' : ' ...'),
              isUser: isUserTranscription,
              timestamp: reader.info.timestamp || Date.now(),
              sender: isUserTranscription ? 'You' : 'Agent',
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

        // Stream ended - always remove "..." indicator
        setMessages((prev) => {
          const existingIndex = prev.findIndex(m => m.id === messageId);
          if (existingIndex >= 0) {
            const newMessages = [...prev];
            newMessages[existingIndex] = {
              ...newMessages[existingIndex],
              message: fullText, // Remove "..." regardless of isFinal
            };
            return newMessages;
          }
          return prev;
        });
      } catch (error) {
        console.error('[LiveKit] Transcription error:', error);
      }
    };

    try {
      room.registerTextStreamHandler('lk.transcription', handleTranscription);
    } catch (error) {
      console.error('[LiveKit] Handler registration failed:', error);
    }

    // Cleanup: unregister handler when component unmounts
    return () => {
      try {
        // @ts-ignore - unregister method may not be in type definitions
        if (room && room.unregisterTextStreamHandler) {
          room.unregisterTextStreamHandler('lk.transcription');
        }
      } catch (error) {
        // Silently ignore unregister errors
      }
    };
  }, [room, localParticipant.identity]);

  // Handle text chat messages (separate from voice transcriptions)
  useEffect(() => {
    chatMessages.forEach((msg) => {
      // Only process user's own text chat messages
      if (msg.from?.identity === localParticipant.identity) {
        const chatMessageId = `chat-${msg.id || msg.timestamp}`;

        setMessages((prev) => {
          // Check if this chat message already exists
          const exists = prev.some(m => m.id === chatMessageId);
          if (!exists) {
            const newMessage: ChatMessage = {
              id: chatMessageId,
              message: msg.message,
              isUser: true,
              timestamp: msg.timestamp,
              sender: 'You',
            };
            return [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp);
          }
          return prev;
        });
      }
    });
  }, [chatMessages, localParticipant.identity]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Send via LiveKit Chat (lk.chat topic)
    await send(text);
  }, [send]);

  return (
    <>
      {/* Render agent audio tracks (hidden, only for playback) */}
      {audioTracks
        .filter(track => track.participant.identity !== localParticipant.identity)
        .map((track) => (
          <AudioTrack
            key={track.publication.trackSid}
            trackRef={track}
            volume={1.0}
          />
        ))}

      <ChatView
        messages={messages}
        onSendMessage={handleSendMessage}
        onNextScreen={onNextScreen}
      />
    </>
  );
}
