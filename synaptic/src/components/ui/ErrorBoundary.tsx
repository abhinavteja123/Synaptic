'use client';

/**
 * ErrorBoundary.tsx – Catch runtime errors gracefully
 */

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="glass-card max-w-md text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-400 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-white/50 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={this.handleReset} className="btn-primary inline-flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
