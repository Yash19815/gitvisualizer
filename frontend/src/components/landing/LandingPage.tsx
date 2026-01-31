// Copyright (c) 2026 Niraj Sharma
// Licensed under CC BY-NC 4.0.
// Commercial use requires a paid license.

import { useState, useEffect } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
}

/**
 * Modern landing page component with premium aesthetics
 * Features animated gradients, glassmorphism effects, and smooth transitions
 */
export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Interactive Visualization",
      description:
        "Explore your Git history through a beautiful, interactive commit graph with intuitive navigation.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Branch Analysis",
      description:
        "Compare branches, analyze merge patterns, and understand your repository's branch structure at a glance.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      title: "Performance Optimized",
      description:
        "Handles massive repositories (10k+ commits) with virtualized rendering and smart streaming.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      title: "Code Insights",
      description:
        "View diffs, browse file trees at any commit, and analyze code churn with detailed metrics.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
      title: "Dark Mode",
      description:
        "Beautiful dark and light themes designed for extended viewing sessions without eye strain.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7c79ff"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Advanced Statistics",
      description:
        "Contributor analytics, activity heatmaps, bus factor analysis, and commit pattern insights.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-blue-500 to-accent-cyan opacity-10 dark:opacity-20 animate-gradient" />

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            {/* Logo */}
            <div className="flex justify-center mb-8 animate-float">
              <div className="p-6 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-glass">
                <svg
                  className="w-20 h-20 text-primary-600 dark:text-primary-400"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">Visualize</span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Your Git History
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto font-light">
              An interactive, high-performance tool to explore commits,
              branches, and contributors with beautiful visualizations and
              powerful analytics.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Get Started</span>
              </button>

              <a
                href="https://github.com/sharmaniraj009/gitvisualizer"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white dark:bg-gray-60 border-2 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400 font-bold rounded-xl hover:bg-primary-50 dark:hover:bg-gray-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                View on GitHub
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="glass-card rounded-2xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300">
                <div className="text-3xl font-bold gradient-text mb-2">
                  10k+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Commits Supported
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300">
                <div className="text-3xl font-bold gradient-text mb-2">
                  60fps
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Smooth Rendering
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300">
                <div className="text-3xl font-bold gradient-text mb-2">∞</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Repo Size
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to understand your repository's history and team
            dynamics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`glass-card rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-primary-600 dark:text-primary-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-gradient" />

          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="gradient-text">Ready to Explore?</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Start visualizing your Git repositories in seconds. No
              installation required.
            </p>
            <button
              onClick={onGetStarted}
              className="group relative px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10">Launch Git Visualizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-600 dark:text-gray-400">
              <p>© 2026 Niraj Sharma. Licensed under CC BY-NC 4.0.</p>
            </div>
            <div className="flex gap-6">
              <a
                href="https://github.com/sharmaniraj009/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/sharmaniraj009/gitvisualizer#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
