'use client';

/**
 * LoadingRoom.tsx – Beautiful multi-step loading animation
 */

import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface LoadingRoomProps {
  currentStep: number;
  steps: string[];
}

export default function LoadingRoom({ currentStep, steps }: LoadingRoomProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/15 blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-6 text-center"
      >
        <div className="mb-8">
          <div className="spinner mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-1">Building Your Memory Room</h2>
          <p className="text-sm text-white/40">This takes about 15–30 seconds</p>
        </div>

        <div className="space-y-3 text-left">
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  isDone ? 'bg-green-500/10' : isActive ? 'bg-primary-500/10' : 'bg-white/[0.02]'
                }`}
              >
                {isDone ? (
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-primary-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-white/10 flex-shrink-0" />
                )}
                <span className={`text-sm ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-white/30'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
