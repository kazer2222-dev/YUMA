'use client';

import { useEffect, useState, useRef } from 'react';

export function GravityCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const isOverButtonRef = useRef(false);
    const [isDark, setIsDark] = useState(true);
    const [isOverButton, setIsOverButton] = useState(false);

    useEffect(() => {
        // Hide native cursor
        document.body.style.cursor = 'none';

        let rafId: number;
        let mouseX = -100;
        let mouseY = -100;

        const updateCursor = () => {
            if (cursorRef.current) {
                const size = isOverButtonRef.current ? 40 : 8;
                const offset = size / 2;
                cursorRef.current.style.left = `${mouseX - offset}px`;
                cursorRef.current.style.top = `${mouseY - offset}px`;
            }
        };

        const moveCursor = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Use requestAnimationFrame for smooth updates
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateCursor);

            // Detect element under cursor
            const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
            if (elementUnder) {
                // Check if hovering over a button or link
                const isButton = elementUnder.tagName === 'BUTTON' ||
                    elementUnder.tagName === 'A' ||
                    elementUnder.closest('button') !== null ||
                    elementUnder.closest('a') !== null;
                
                if (isButton !== isOverButtonRef.current) {
                    isOverButtonRef.current = isButton;
                    setIsOverButton(isButton);
                }

                const computedStyle = window.getComputedStyle(elementUnder);

                // Check text color first (for white text elements)
                const textColor = computedStyle.color;
                const rgbText = textColor.match(/\d+/g);
                if (rgbText && rgbText.length >= 3) {
                    const r = parseInt(rgbText[0]);
                    const g = parseInt(rgbText[1]);
                    const b = parseInt(rgbText[2]);
                    const textBrightness = (r * 299 + g * 587 + b * 114) / 1000;

                    // If text is white/light, background is likely dark, so cursor should be white
                    if (textBrightness > 200) {
                        setIsDark(true);
                        return;
                    }
                }

                // Check background color
                let currentElement: Element | null = elementUnder;
                let foundBackground = false;

                // Traverse up to 5 parent elements to find a non-transparent background
                for (let i = 0; i < 5 && currentElement; i++) {
                    const style = window.getComputedStyle(currentElement);
                    const bgColor = style.backgroundColor;

                    // Parse RGB/RGBA to determine if it's a light background
                    const rgb = bgColor.match(/\d+/g);
                    if (rgb && rgb.length >= 3) {
                        const r = parseInt(rgb[0]);
                        const g = parseInt(rgb[1]);
                        const b = parseInt(rgb[2]);
                        const a = rgb.length >= 4 ? parseFloat(rgb[3]) : 1;

                        // Only consider if not fully transparent
                        if (a > 0.1) {
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;

                            // If brightness > 180 (lowered threshold), it's light, cursor should be black
                            if (brightness > 180) {
                                setIsDark(false);
                                foundBackground = true;
                                break;
                            } else if (brightness < 80) {
                                // Dark background, cursor should be white
                                setIsDark(true);
                                foundBackground = true;
                                break;
                            }
                        }
                    }

                    currentElement = currentElement.parentElement;
                }

                // Default to white cursor (dark background)
                if (!foundBackground) {
                    setIsDark(true);
                }
            }
        };

        window.addEventListener('mousemove', moveCursor);
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            if (rafId) cancelAnimationFrame(rafId);
            document.body.style.cursor = 'auto'; // Reset cursor on unmount
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="fixed rounded-full pointer-events-none z-[9999] transition-all duration-150 will-change-[width,height,border-width]"
            style={{
                left: '-100px',
                top: '-100px',
                width: isOverButton ? '40px' : '8px',
                height: isOverButton ? '40px' : '8px',
                backgroundColor: isOverButton ? 'transparent' : (isDark ? '#ffffff' : '#000000'),
                borderWidth: isOverButton ? '2px' : '0',
                borderStyle: 'solid',
                borderColor: isDark ? '#ffffff' : '#000000',
            }}
        />
    );
}
