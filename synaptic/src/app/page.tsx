'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Camera, Users, Sparkles, Heart, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: Camera,
    title: 'AI-Generated Rooms',
    description: 'Upload photos and a description — AI builds an explorable 3D space in seconds.',
    color: 'text-amber-400',
  },
  {
    icon: Users,
    title: 'Walk Together, Worlds Apart',
    description: 'Real-time multiplayer lets you explore memories with loved ones anywhere.',
    color: 'text-teal-400',
  },
  {
    icon: Sparkles,
    title: 'Emotions Come Alive',
    description: 'The environment reacts to your conversation — happy chats brighten the room.',
    color: 'text-purple-400',
  },
  {
    icon: Heart,
    title: 'Preserve Legacies Forever',
    description: 'Turn elderly family stories into narrated, interactive memory rooms.',
    color: 'text-pink-400',
  },
];

const steps = [
  { num: '01', title: 'Upload Photos', desc: 'Add 2-5 photos from your memory' },
  { num: '02', title: 'Describe the Moment', desc: 'Tell us what made it special' },
  { num: '03', title: 'AI Creates Your Space', desc: 'Watch your memory become a 3D world' },
  { num: '04', title: 'Share & Explore', desc: 'Invite loved ones to walk through it together' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* ====== HERO ====== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/20 blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <Brain className="h-4 w-4" />
            <span>Powered by AI &amp; Three.js</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-white via-primary-200 to-purple-300 bg-clip-text text-transparent">
              Memories Become Places
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl">
            Transform your cherished moments into immersive 3D spaces. Walk through them
            together with the people you love, no matter where they are.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/create" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Create Your First Room
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/gallery" className="btn-secondary px-8 py-4 text-lg">
              Explore Gallery
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-white/30 text-xs"
        >
          <span>Scroll to explore</span>
          <div className="h-6 w-4 rounded-full border border-white/20 flex justify-center pt-1">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-1.5 w-1 rounded-full bg-white/40"
            />
          </div>
        </motion.div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center text-3xl font-bold sm:text-4xl"
        >
          What Makes Synaptic Special
        </motion.h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
              className="glass-card group"
            >
              <f.icon className={`h-10 w-10 ${f.color} mb-4`} />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-white/50">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center text-3xl font-bold sm:text-4xl mb-16"
        >
          How It Works
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400 text-xl font-bold">
                {s.num}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-white/50">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="glass-card py-16"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Relive Your Memories?</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Turn your favorite photos into immersive 3D spaces you can explore with the people you love.
          </p>
          <Link href="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Get Started — It&apos;s Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
