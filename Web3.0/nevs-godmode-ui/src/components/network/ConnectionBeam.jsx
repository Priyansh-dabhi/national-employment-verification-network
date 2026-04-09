import React from 'react';
import { motion } from 'framer-motion';

const ConnectionBeam = ({
    isActive = true,
    isCatchingUp = false,
    direction = 'left' // 'left' or 'right' depending on peer position relative to cloud
}) => {
    // SVG Path drawing a bezier curve from Top-Center to Bottom-Left or Bottom-Right
    const pathD = direction === 'left'
        ? "M 100 0 C 100 50, 0 50, 0 100"
        : "M 0 0 C 0 50, 100 50, 100 100";

    // Color logic
    const strokeColor = isActive
        ? (isCatchingUp ? '#ffb800' : '#00f0ff')
        : '#1f3a5f';

    return (
        <div className="w-[100px] h-[100px]">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                {/* Base Track */}
                <path d={pathD} stroke="#1a2639" strokeWidth="4" />

                {/* Glowing Beam */}
                <motion.path
                    d={pathD}
                    stroke={strokeColor}
                    strokeWidth={isActive ? "4" : "0"}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: isActive ? 1 : 0,
                        opacity: isActive ? 1 : 0
                    }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />

                {/* Data pulses traveling along the beam */}
                {isActive && (
                    <motion.circle
                        r="4"
                        fill={strokeColor}
                        style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}
                        animate={{
                            offsetDistance: ["100%", "0%"]
                        }}
                        transition={{
                            duration: isCatchingUp ? 1 : 2, // Faster if catching up to simulate high packet load
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    // Framer motion allows animating SVG along path if we use special properties or just simple dash array trick.
                    // For true SVG path animation we use stroke-dasharray.
                    />
                )}

                {/* Alternative dash-array animation for the beam flow data */}
                {isActive && (
                    <motion.path
                        d={pathD}
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeDasharray="10 30"
                        animate={{
                            strokeDashoffset: [40, 0]
                        }}
                        style={{ filter: `drop-shadow(0 0 5px #ffffff)` }}
                        transition={{
                            duration: isCatchingUp ? 0.5 : 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                )}
            </svg>
        </div>
    );
};

export default ConnectionBeam;
