'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    deferredPwaPrompt: any;
    promptPwaInstall: () => void;
  }
}

export default function PwaManager() {
  const [isOffline, setIsOffline] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // 2. Offline Detection
    const handleOnline = () => {
      setIsOffline(false);
      window.dispatchEvent(new CustomEvent('pwa-network-status', { detail: { online: true } }));
    };

    const handleOffline = () => {
      setIsOffline(true);
      window.dispatchEvent(new CustomEvent('pwa-network-status', { detail: { online: false } }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine === false) {
      setIsOffline(true);
    }

    // 3. BeforeInstallPrompt Event Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store event globally for other components to access
      window.deferredPwaPrompt = e;
      // Dispatch event to notify components that the app is installable
      window.dispatchEvent(new Event('pwa-install-ready'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Define a global helper function to trigger the installation prompt
    window.promptPwaInstall = () => {
      const promptEvent = window.deferredPwaPrompt;
      if (promptEvent) {
        promptEvent.prompt();
        promptEvent.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt');
            window.deferredPwaPrompt = null;
            window.dispatchEvent(new Event('pwa-installed-success'));
          } else {
            console.log('[PWA] User dismissed the install prompt');
          }
        });
      } else {
        // Fallback or iOS detection
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        
        if (isIos && !isStandalone) {
          setShowIosGuide(true);
        } else {
          alert('To install this app, search for the Install option in your browser settings menu (usually top right three dots).');
        }
      }
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <>
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div className="pwa-offline-banner">
          <span className="pwa-offline-icon">⚠️</span>
          <span className="pwa-offline-text">
            Offline Mode: Working with cached records. Some actions (like saving new batches) require server access and will sync once online.
          </span>
        </div>
      )}

      {/* iOS PWA Installation Guide Modal */}
      {showIosGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="pwa-ios-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-ios-modal-header">
              <h3>Install TrammelNet on iOS</h3>
              <button className="pwa-ios-close-btn" onClick={() => setShowIosGuide(false)}>
                &times;
              </button>
            </div>
            <div className="pwa-ios-modal-body">
              <p>Install this application on your iPhone or iPad for offline access and full-screen workspace:</p>
              <ol className="pwa-ios-steps">
                <li>
                  Open this page in the **Safari** app (other browsers like Chrome or Firefox do not support installation).
                </li>
                <li>
                  Tap the **Share** button <span className="pwa-icon-share">📤</span> at the bottom of the screen (or top on iPad).
                </li>
                <li>
                  Scroll down the share menu and select **Add to Home Screen** <span className="pwa-icon-add">➕</span>.
                </li>
                <li>
                  Tap **Add** in the top-right corner to complete the installation.
                </li>
              </ol>
            </div>
            <div className="pwa-ios-modal-footer">
              <button className="primary" onClick={() => setShowIosGuide(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
