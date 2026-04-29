"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";

const FRAME_COUNT = 120;
const FRAME_PATH = "/animations/hero-sequence/frame_";

export default function HeroSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      const promises = [];

      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const frameIndex = i.toString().padStart(4, "0");
        img.src = `${FRAME_PATH}${frameIndex}.png`;
        promises.push(
          new Promise((resolve) => {
            img.onload = resolve;
          })
        );
        loadedImages.push(img);
      }

      await Promise.all(promises);
      setImages(loadedImages);
      setIsLoaded(true);
    };

    preloadImages();
  }, []);

  // Map scroll progress to frame index
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1], { clamp: true });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1], { clamp: true });
  const canvasOpacity = useTransform(scrollYProgress, [0.95, 1], [1, 0.4], { clamp: true });


  const drawFrame = (index: number) => {
    if (!canvasRef.current || images.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = images[Math.floor(index)];
    if (!img) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw image centered and scaled
    const canvas = canvasRef.current;
    const scaleFactor = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width / 2) - (img.width / 2) * scaleFactor;
    const y = (canvas.height / 2) - (img.height / 2) * scaleFactor;

    ctx.drawImage(img, x, y, img.width * scaleFactor, img.height * scaleFactor);
  };

  // Update canvas on scroll
  useMotionValueEvent(frameIndex, "change", (latest) => {
    requestAnimationFrame(() => drawFrame(latest));
  });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // Draw current frame after resize
        drawFrame(frameIndex.get());
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [isLoaded, images]);

  // Initial draw
  useEffect(() => {
    if (isLoaded) {
      drawFrame(0);
    }
  }, [isLoaded]);

  return (
    <div className="fixed inset-0 z-0">
      <motion.canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{
          scale: scale,
          opacity: canvasOpacity,
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-neon-blue animate-pulse font-mono tracking-widest">
            INITIALIZING THINK LOOP...
          </div>
        </div>
      )}
    </div>
  );
}

