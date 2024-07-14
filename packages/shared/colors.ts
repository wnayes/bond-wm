// type RGBArray = [R: number, G: number, B: number];
export type RGBAArray = [R: number, G: number, B: number, A: number];

export const TransparentRGBAArray: RGBAArray = [0, 0, 0, 0];

const HexRegex = /^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i;
const RGBRegex = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const RGBARegex = /^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;

export function RGBAArrayToCSSColorString(arr: RGBAArray): string {
  if (arr[3] === 255) {
    return (
      "#" + arr[0].toString().padStart(2, "0") + arr[1].toString().padStart(2, "0") + arr[2].toString().padStart(2, "0")
    );
  } else {
    return `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${arr[3] / 255})`;
  }
}

export function CSSColorStringToRGBAArray(value: string): RGBAArray {
  const valueLower = value.toLowerCase().trim();

  if (valueLower === "transparent") {
    return TransparentRGBAArray;
  }

  // If needed, `import ColorNames from "color-name";`
  // const colorNameRGB: RGBArray | undefined = (ColorNames as any)[valueLower];
  // if (colorNameRGB) {
  //   return [colorNameRGB[0], colorNameRGB[1], colorNameRGB[2], 255];
  // }

  let match;

  // #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (valueLower.startsWith("#")) {
    match = HexRegex.exec(valueLower);
    if (match) {
      let r, g, b, a;
      switch (valueLower.length) {
        // #RGB
        // #RGBA
        case 4:
        case 5:
          r = parseInt(valueLower.substring(1, 2).repeat(2), 16);
          g = parseInt(valueLower.substring(2, 3).repeat(2), 16);
          b = parseInt(valueLower.substring(3, 4).repeat(2), 16);
          a = valueLower.length === 5 ? parseInt(valueLower.substring(4, 5).repeat(2), 16) : 255;
          break;

        // #RRGGBB
        // #RRGGBBAA
        case 7:
        case 9:
          r = parseInt(valueLower.substring(1, 3), 16);
          g = parseInt(valueLower.substring(3, 5), 16);
          b = parseInt(valueLower.substring(5, 7), 16);
          a = valueLower.length === 9 ? parseInt(valueLower.substring(7, 9), 16) : 255;
          break;

        default:
          throw new Error("Invalid argument");
      }

      return [r, g, b, a];
    }
  }

  if (valueLower.startsWith("rgb")) {
    if (valueLower.startsWith("rgba")) {
      // rgba(0, 0, 0, 0)
      match = RGBARegex.exec(valueLower);
      if (match) {
        return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), parseFloat(match[4]) * 255];
      }
    } else {
      // rgb(0, 0, 0)
      match = RGBRegex.exec(valueLower);
      if (match) {
        return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), 255];
      }
    }
  }

  throw new Error(`Color value ${value} not supported`);
}
