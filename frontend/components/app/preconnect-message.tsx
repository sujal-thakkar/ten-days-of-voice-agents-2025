'use client';

import { AnimatePresence, motion, type Variants, type HTMLMotionProps } from 'motion/react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { ShimmerText } from '@/components/livekit/shimmer-text';
import { cn } from '@/lib/utils';

const MotionMessage = motion.create('p');

const VIEW_VARIANTS: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const VIEW_MOTION_PROPS: HTMLMotionProps<'p'> = {
  variants: VIEW_VARIANTS,
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.5, delay: 0.4, ease: [0.42, 0, 0.58, 1] },
};

interface PreConnectMessageProps {
  messages?: ReceivedChatMessage[];
  className?: string;
}

export function PreConnectMessage({ className, messages = [] }: PreConnectMessageProps) {
  return (
    <AnimatePresence>
      {messages.length === 0 && (
        <MotionMessage
          {...VIEW_MOTION_PROPS}
          aria-hidden={messages.length > 0}
          className={cn('pointer-events-none text-center', className)}
        >
          <ShimmerText className="text-sm font-semibold">
            Agent is listening, ask it a question
          </ShimmerText>
        </MotionMessage>
      )}
    </AnimatePresence>
  );
}
