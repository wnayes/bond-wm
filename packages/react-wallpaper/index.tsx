import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { usePluginState, useBrowserWindowSize, useCompositeScreenSize, useScreen } from "@bond-wm/react";

const PackageName = "@bond-wm/wallpaper";

/** A dynamic wallpaper for bond-wm. */
export function Wallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: screenWidth, height: screenHeight } = useBrowserWindowSize();
  const { width: totalWidth, height: totalHeight } = useCompositeScreenSize({ cssPixels: true });
  const screen = useScreen();

  const [seed, setSeed] = usePluginState<IWallpaperSeed>(PackageName);
  const [wallpaper, setWallpaper] = useState<CanvasRenderingContext2D | null>(null);

  useLayoutEffect(() => {
    if (!seed) {
      setSeed(generateWallpaperSeed(totalWidth));
    }
  }, [seed, setSeed, totalWidth]);

  useLayoutEffect(() => {
    if (!seed) {
      return;
    }

    setWallpaper(createWallpaper(seed, totalWidth, totalHeight));
  }, [seed, totalWidth, totalHeight]);

  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !wallpaper) {
      return;
    }

    paintWallpaperToScreen(wallpaper, ctx, screenWidth, screenHeight, screen.x, screen.y);
  }, [wallpaper, screenWidth, screenHeight, screen.x, screen.y]);

  return (
    <canvas
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
      }}
      ref={canvasRef}
      width={screenWidth}
      height={screenHeight}
    ></canvas>
  );
}

interface IWallpaperSeed {
  segments: number;
  wavelength: number;
  layers: number;
  hueStart: number;
  hueIncrement: number;
  ampl: number;
  offset: number;
  offsetIncrement: number;
  sat: number;
  light: number;
  lightIncrement: number;
}

// This rendering algorithm is modified from
// https://github.com/roytanck/wallpaper-generator

function generateWallpaperSeed(width: number): IWallpaperSeed {
  // line segments (either few, or fluent lines (200))
  const segments = Math.random() < 0.5 ? 1 + Math.floor(9 * Math.random()) : 200;
  const wavelength = width / (5 + 15 * Math.random());

  const layers = 3 + Math.floor(10 * Math.random());
  const hueStart = 360 * Math.random();
  const hueIncrement = 20 - 40 * Math.random();
  const ampl = 0.1 * wavelength + 0.9 * wavelength * Math.random();
  const offset = width * Math.random();
  const offsetIncrement = width / 20 + (width / 10) * Math.random();
  const sat = 15 + 35 * Math.random();
  const light = 15 + 45 * Math.random();
  const lightIncrement = Math.random() < 0.5 ? 2 + 4 * Math.random() : -(2 + 4 * Math.random());

  return {
    segments,
    wavelength,
    layers,
    hueStart,
    hueIncrement,
    ampl,
    offset,
    offsetIncrement,
    sat,
    light,
    lightIncrement,
  };
}

function createWallpaper(seed: IWallpaperSeed, width: number, height: number): CanvasRenderingContext2D {
  const {
    segments,
    wavelength,
    layers,
    hueStart,
    hueIncrement,
    ampl,
    offset,
    offsetIncrement,
    sat,
    light,
    lightIncrement,
  } = seed;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "hsl( " + hueStart + ", " + sat + "%, " + light + "% )";
  ctx.fillRect(0, 0, width, height);

  for (let l = 0; l < layers; l++) {
    const h = hueStart + (l + 1) * hueIncrement;
    const s = sat;
    const v = light + (l + 1) * lightIncrement;
    ctx.fillStyle = "hsl( " + h + ", " + s + "%, " + v + "% )";
    ctx.beginPath();
    const layerOffset = offset + offsetIncrement * l;
    const offsetY = (l + 0.5) * (height / layers);
    const startY = offsetY + ampl * Math.sin(layerOffset / wavelength);
    ctx.moveTo(0, startY);
    for (let i = 0; i <= segments; i++) {
      const x = i * (width / segments);
      ctx.lineTo(x, startY + ampl * Math.sin((layerOffset + x) / wavelength));
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, startY);
    ctx.fill();
  }

  return ctx;
}

function paintWallpaperToScreen(
  wallpaper: CanvasRenderingContext2D,
  targetContext: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number,
  screenX: number,
  screenY: number
): void {
  const wallpaperSubsetData = wallpaper.getImageData(screenX, screenY, screenWidth, screenHeight);
  targetContext.putImageData(wallpaperSubsetData, 0, 0);
}
