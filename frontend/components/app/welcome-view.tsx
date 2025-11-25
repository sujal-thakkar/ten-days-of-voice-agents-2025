import { motion } from 'motion/react';
import { ArrowRight, Lightning, Student, ChalkboardTeacher, Star, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/livekit/button';

interface WelcomeViewProps {
  onStart: () => void;
}

export function WelcomeView({ onStart }: WelcomeViewProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-y-auto overflow-x-hidden bg-[#05070B] text-white font-sans selection:bg-[#0056D2]/40">

      {/* Background - Clean & Professional */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#002C66]/40 via-[#05070B] to-[#05070B]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-grow flex-col items-center justify-center px-6 py-20 text-center">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16 max-w-4xl"
        >
          {/* Logo / Brand */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0056D2] text-white shadow-lg shadow-blue-900/30">
              <Student weight="fill" className="h-7 w-7" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold tracking-tight text-white leading-none">Coursera</h2>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00A5E8]">Learning Coach</p>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Master concepts with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A5E8] via-[#4CA1F8] to-[#00A5E8]">Active Recall</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-neutral-400 leading-relaxed mb-10">
            Your AI mentor for structured learning. We break down complex topics into manageable modules, test your understanding, and ensure retention.
          </p>

          {/* Topics List */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {["Variables", "Loops", "Agentic AI", "MCP"].map((topic) => (
              <div key={topic} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-neutral-300">
                <CheckCircle weight="fill" className="text-[#00A5E8]" />
                {topic}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={onStart}
            className="group relative px-8 py-6 text-base font-semibold text-white bg-[#0056D2] hover:bg-[#00419E] rounded-lg transition-all shadow-lg shadow-blue-900/20"
          >
            <div className="flex items-center gap-3">
              <span>Start Learning Session</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {[
            {
              icon: Student,
              title: "Learn",
              desc: "Interactive explanations tailored to your pace.",
            },
            {
              icon: Lightning,
              title: "Quiz",
              desc: "Immediate feedback to reinforce your knowledge.",
            },
            {
              icon: ChalkboardTeacher,
              title: "Teach-Back",
              desc: "Verbalize concepts to prove mastery.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col items-start p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="mb-4 rounded-lg bg-[#0056D2]/10 p-3 text-[#00A5E8]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Footer */}
      <div className="relative mt-auto py-6 text-center border-t border-white/5 bg-[#05070B]">
        <p className="text-neutral-600 text-xs font-medium uppercase tracking-wider">
          Powered by LiveKit & Coursera Learning Coach
        </p>
      </div>
    </div>
  );
}
