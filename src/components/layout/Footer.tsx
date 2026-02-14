import { Brain, Github } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Brain className="h-4 w-4" />
          <span>Synaptic &copy; {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-white/30 text-center">
          Memories become places. Built with Next.js, Three.js & Google Gemini.
        </p>
        <Link
          href="https://github.com"
          target="_blank"
          className="text-white/40 hover:text-white/70 transition-colors"
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </Link>
      </div>
    </footer>
  );
}
