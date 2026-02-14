// Haptic + Audio feedback for scan success
export function playSuccessFeedback(): void {
    // 1. Haptic vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
    }

    // 2. Beep sound using Web Audio API (zero latency)
    try {
        const AudioContextClass =
            typeof window !== "undefined"
                ? window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext
                : null;

        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.15
        );

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch {
        // Silently fail on environments without AudioContext
    }
}

export function playErrorFeedback(): void {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }

    try {
        const AudioContextClass =
            typeof window !== "undefined"
                ? window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext
                : null;

        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.2
        );

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
        // Silently fail
    }
}
