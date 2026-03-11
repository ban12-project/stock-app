"use client";

/**
 * Renders <link rel="apple-touch-startup-image"> tags for all common iOS devices.
 * Uses a single source image centered on a solid background.
 *
 * Next.js automatically hoists <link> tags to <head>.
 */

// All common iOS device viewport configs (portrait only)
const STARTUP_IMAGE_DEVICES = [
  // iPhone SE (3rd gen) / iPhone 8
  { w: 375, h: 667, r: 2 },
  // iPhone 8 Plus
  { w: 414, h: 736, r: 3 },
  // iPhone X / XS / 11 Pro
  { w: 375, h: 812, r: 3 },
  // iPhone XR / 11
  { w: 414, h: 896, r: 2 },
  // iPhone XS Max / 11 Pro Max
  { w: 414, h: 896, r: 3 },
  // iPhone 12 mini / 13 mini
  { w: 360, h: 780, r: 3 },
  // iPhone 12 / 12 Pro / 13 / 13 Pro / 14
  { w: 390, h: 844, r: 3 },
  // iPhone 12 Pro Max / 13 Pro Max / 14 Plus
  { w: 428, h: 926, r: 3 },
  // iPhone 14 Pro / 15 / 15 Pro / 16
  { w: 393, h: 852, r: 3 },
  // iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus
  { w: 430, h: 932, r: 3 },
  // iPhone 16 Pro
  { w: 402, h: 874, r: 3 },
  // iPhone 16 Pro Max
  { w: 440, h: 956, r: 3 },
] as const;

export function AppleSplashScreens({ icon = "/icon-512x512.png" }: { icon?: string }) {
  return (
    <>
      {STARTUP_IMAGE_DEVICES.map(({ w, h, r }) => (
        <link
          key={`${w}-${h}-${r}`}
          rel="apple-touch-startup-image"
          href={icon}
          media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r})`}
        />
      ))}
    </>
  );
}
