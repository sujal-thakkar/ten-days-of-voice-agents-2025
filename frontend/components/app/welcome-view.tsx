import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight, Brain, Mic, Sparkles, Video, Image as ImageIcon, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/livekit/button';

export const WelcomeView = ({
  startButtonText,
  onStartCall,
}: {
  startButtonText: string;
  onStartCall: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-background">
      {/* Hero Section */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden p-4 text-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Background"
            className="h-full w-full object-cover opacity-40 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />
        </div>

        <motion.div
          className="z-10 flex max-w-4xl flex-col items-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8"
          >
            <img src="/logo.png" alt="Hosla Logo" className="h-32 w-auto object-contain drop-shadow-2xl" />
          </motion.div>

          {/* Hero Text */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="mb-6 text-6xl font-extrabold tracking-tight text-foreground md:text-8xl"
          >
            Your Voice, <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Extended Family
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="mb-10 max-w-2xl text-xl text-muted-foreground md:text-2xl font-light"
          >
            An immersive AI companion that listens, understands, and supports you.
            Experience the future of connection.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onStartCall}
              className="group relative overflow-hidden rounded-full px-10 py-8 text-xl font-bold shadow-2xl transition-all hover:scale-105 hover:shadow-primary/40"
            >
              <span className="relative z-10 flex items-center gap-3">
                {startButtonText}
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 animate-bounce text-muted-foreground"
          >
            <p className="text-sm">Scroll to explore</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Section 1: Support */}
      <section className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-12 p-8 md:grid-cols-2 md:p-24 bg-background/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center space-y-6"
        >
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-8 w-8" />
            <span className="text-lg font-semibold uppercase tracking-wider">Always Here</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            More Than Just an AI. <br />
            <span className="text-muted-foreground">A True Companion.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Hosla isn't just about answering questions. It's about understanding the nuance of your voice,
            providing empathy, and being there like an extended family member. Powered by Murf TTS Falcon
            for the most lifelike interactions.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border/50"
        >
          <img src="/feature-support.png" alt="Supportive AI" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </motion.div>
      </section>

      {/* Feature Section 2: Multimedia */}
      <section className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-12 p-8 md:grid-cols-2 md:p-24 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="order-2 md:order-1 relative aspect-video overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border/50"
        >
          <img src="/feature-multimedia.png" alt="Multimedia Capabilities" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="order-1 md:order-2 flex flex-col justify-center space-y-6"
        >
          <div className="flex items-center gap-3 text-accent">
            <Video className="h-8 w-8" />
            <span className="text-lg font-semibold uppercase tracking-wider">Multimodal Power</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            See, Hear, and <br />
            <span className="text-muted-foreground">Understand Everything.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Share videos, images, and documents. Hosla analyzes them in real-time to provide
            context-aware insights. Whether it's a family photo or a complex document,
            your agent is ready to help.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-sm border border-border">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Video Analysis</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-sm border border-border">
              <ImageIcon className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Image Recognition</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it Works / Capabilities */}
      <section className="relative z-10 py-24 px-8 text-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold md:text-4xl">How Hosla Works</h2>
          <p className="mt-4 text-muted-foreground">Seamless interaction powered by advanced AI.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            { icon: Mic, title: "Speak Naturally", desc: "No wake words. Just talk like you would to a friend." },
            { icon: Brain, title: "Deep Understanding", desc: "Advanced LLMs process context, emotion, and intent." },
            { icon: MessageSquareText, title: "Instant Response", desc: "Real-time voice synthesis for fluid conversation." }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-24 px-8 text-center bg-muted/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold md:text-5xl mb-8">Ready to meet your Extended Family?</h2>
          <Button
            variant="primary"
            size="lg"
            onClick={onStartCall}
            className="rounded-full px-12 py-8 text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Start Conversation
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© 2025 Hosla Extended Family. Powered by LiveKit & Murf AI.</p>
      </footer>
    </div>
  );
};
