import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import "./TeamForgeLauncher.css";
export default function TeamForgeLauncher({ children }) {
  const [showIntro, setShowIntro] = useState(
    () => Capacitor.isNativePlatform()
  );
  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [showIntro]);
  return (
    <>
      {children}
      {showIntro && (
        <div className="tf-launcher" role="status" aria-label="Opening TeamForge">
          <div className="tf-launcher-glow" />
          <div className="tf-particles">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>
          <div className="tf-launcher-content">
            <div className="tf-logo-stage">
              <div className="tf-orbit tf-orbit-one" />
              <div className="tf-orbit tf-orbit-two" />
              <div className="tf-logo-3d">
                <img src="/teamforge-logo.svg" alt="" />
              </div>
            </div>
            <h1>TeamForge</h1>
            <p>BUILD SOMETHING BRILLIANT</p>
            <div className="tf-loader"><span /></div>
          </div>
        </div>
      )}
    </>
  );
}