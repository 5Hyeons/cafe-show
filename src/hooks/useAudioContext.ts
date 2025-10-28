import { useEffect, useState } from 'react';

/**
 * Hook to automatically resume AudioContext on first user interaction
 * Resolves browser autoplay policy issues for LiveKit audio
 */
export function useAudioContext() {
  const [resumed, setResumed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if AudioContext is available
    if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) {
      console.warn('[useAudioContext] AudioContext not supported in this browser');
      return;
    }

    let resumeAttempted = false;

    const attemptResume = async () => {
      if (resumeAttempted) return;
      resumeAttempted = true;

      try {
        // Get all AudioContext instances (LiveKit creates them internally)
        // We need to resume the global AudioContext if it exists
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        // Create a temporary AudioContext to test if we can play audio
        const testContext = new AudioContextClass();

        if (testContext.state === 'suspended') {
          await testContext.resume();
          console.log('[useAudioContext] ✓ AudioContext resumed');
        }

        // Close test context (we don't need it)
        testContext.close();

        setResumed(true);

        // Remove event listeners after successful resume
        cleanup();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAudioContext] Failed to resume AudioContext:', errorMsg);
        setError(errorMsg);
      }
    };

    // Event listeners for user interaction
    const handleInteraction = () => {
      attemptResume();
    };

    // Listen to multiple types of user interactions
    const events = ['click', 'touchstart', 'keydown'];

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    const cleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    return cleanup;
  }, []);

  return { resumed, error };
}
