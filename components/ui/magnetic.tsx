'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function Magnetic({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current?.getBoundingClientRect() || { height: 0, width: 0, left: 0, top: 0 };
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        // Calculate distance from center
        const distance = Math.sqrt(middleX * middleX + middleY * middleY);
        // Maximum displacement to prevent overlap (adjust based on button size)
        const maxDistance = 20;
        // Reduce strength based on distance to create a smoother falloff
        const strength = 0.2;
        
        // Limit the maximum displacement
        const limitedDistance = Math.min(distance * strength, maxDistance);
        const ratio = distance > 0 ? limitedDistance / distance : 0;
        
        setPosition({ 
            x: middleX * ratio, 
            y: middleY * ratio 
        });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.div
            style={{ position: 'relative', zIndex: 1 }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.1 }}
        >
            {children}
        </motion.div>
    );
}
