import React, { useState } from 'react';
import { Shield, MessageSquare, Code, Download, X } from 'lucide-react';
import { CodeWaveIcon } from './CodeWaveLogo';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  BRAND_NAME,
  BRAND_URL,
  FEEDBACK_URL,
  REPO_URL,
} from '../config/app';

const YEAR = new Date().getFullYear();

const linkClass =
  'inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors';

const BrandCredit: React.FC = () =>
  BRAND_URL ? (
    <a href={BRAND_URL} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-sky-500 transition-colors">
      {BRAND_NAME}
    </a>
  ) : (
    <span className="font-semibold">{BRAND_NAME}</span>
  );

export const PrivacyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 id="privacy-title" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-500" />
          Privacy
        </h3>
        <button
          onClick={onClose}
          aria-label="Close privacy"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          Your schedule, tasks and settings are stored only in this browser on this device. There
          are no accounts and nothing is uploaded to {BRAND_NAME}.
        </p>
        <p>
          When you use the AI Coach, your message and today's schedule are sent to Google Gemini
          to generate suggestions.
        </p>
        <p>
          Clearing your browser data deletes your schedule, so export a backup regularly from
          Preferences.
        </p>
      </div>
    </div>
  </div>
);

export const AppFooter: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <footer className="hidden md:block mt-12 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5 min-w-0">
          <CodeWaveIcon size={24} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{APP_NAME}</span>
          <span className="hidden lg:inline">· {APP_TAGLINE}</span>
        </div>

        <nav className="flex flex-wrap items-center gap-5" aria-label="Footer">
          {FEEDBACK_URL && (
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <MessageSquare className="w-3.5 h-3.5" />
              Send feedback
            </a>
          )}
          <button onClick={() => setShowPrivacy(true)} className={linkClass}>
            <Shield className="w-3.5 h-3.5" />
            Privacy
          </button>
          {REPO_URL && (
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <Code className="w-3.5 h-3.5" />
              Source code
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <span className="font-mono">v{APP_VERSION}</span>
          <span>·</span>
          <span>
            © {YEAR} <BrandCredit />
          </span>
        </div>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </footer>
  );
};

export const AboutCard: React.FC<{ onBackup: () => void }> = ({ onBackup }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  const rowClass =
    'flex items-center gap-2 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors';

  return (
    <div className="md:hidden p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <CodeWaveIcon size={40} />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">About {APP_NAME}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{APP_TAGLINE}</p>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={onBackup} className={rowClass}>
          <Download className="w-4 h-4 text-sky-500" />
          Back up my data
        </button>
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={rowClass}>
            <MessageSquare className="w-4 h-4 text-violet-500" />
            Send feedback / report a bug
          </a>
        )}
        <button onClick={() => setShowPrivacy(true)} className={rowClass}>
          <Shield className="w-4 h-4 text-emerald-500" />
          Privacy
        </button>
        {REPO_URL && (
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={rowClass}>
            <Code className="w-4 h-4 text-orange-500" />
            Source code
          </a>
        )}
      </div>

      <p className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
        <span className="font-mono">v{APP_VERSION}</span> · © {YEAR} <BrandCredit />
      </p>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};