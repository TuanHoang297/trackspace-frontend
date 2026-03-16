import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1200): number {
    const [current, setCurrent] = useState(0);
    const prevTarget = useRef(0);

    useEffect(() => {
        if (target === prevTarget.current) return;
        prevTarget.current = target;

        const startVal = 0;
        const startTime = performance.now();

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const value = startVal + (target - startVal) * easedProgress;

            setCurrent(value);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return current;
}
