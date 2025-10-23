"use client";
import Image from "next/image";
import { motion } from "motion/react";

interface FractalImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  frosted?: boolean;
}

export default function FractalImage({
  src,
  alt,
  width,
  height,
  className = "",
  frosted = false,
}: FractalImageProps) {
  return (
    <div className="relative inline-block">
      {/* SVG filter definition for fractal noise */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="fractal-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="2.5"
              numOctaves="1"
              seed="10"
            />
            <feDisplacementMap in="SourceGraphic" scale="5" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1.2 0"
            />
          </filter>
        </defs>
      </svg>

      <div className="relative">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />

        {/* Frosted glass overlay */}
        {frosted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-md overflow-hidden"
            style={{
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
            }}
          >
            {/* Scattered noise overlay */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                filter: "url(#fractal-noise) contrast(1.8)",
                mixBlendMode: "soft-light",
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
