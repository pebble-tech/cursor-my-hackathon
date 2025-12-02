# QR Code with Logo Embedding - Research Outcome

**Research Date:** December 2, 2025  
**Purpose:** Enable embedding Cursor logo in center of QR codes for both frontend display and backend email generation.

---

## Summary

QR codes support logo embedding due to built-in error correction. By using error correction level "H" (High), up to 30% of QR code can be obscured while remaining scannable. This allows placing a logo in the center without breaking functionality.

---

## Frontend Solution (Recommended)

### Option A: `qr-code-styling` (Recommended)

Most feature-rich library with TypeScript support, designed specifically for customizable QR codes with logos.

**Installation:**
```bash
pnpm add qr-code-styling
```

**Usage:**
```typescript
import QRCodeStyling from 'qr-code-styling';

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  type: 'svg', // or 'canvas'
  data: 'qr-payload-here',
  image: '/cursor-logo.png',
  dotsOptions: {
    color: '#18181b',
    type: 'rounded', // 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 4,
    imageSize: 0.4, // Logo size relative to QR (0.3-0.4 recommended)
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
  },
  cornersDotOptions: {
    type: 'dot',
  },
  qrOptions: {
    errorCorrectionLevel: 'H', // Critical for logo support
  },
});

// Render to element
qrCode.append(document.getElementById('qr-container'));

// Or get as data URL
const dataUrl = await qrCode.getRawData('png');
```

**Pros:**
- TypeScript support
- Rich customization (dot styles, colors, corners)
- Supports canvas and SVG output
- Active maintenance
- Built-in logo sizing and positioning

**Cons:**
- Larger bundle size (~50KB)

---

### Option B: `qrcode-with-logos`

Lightweight alternative focused on logo embedding.

**Installation:**
```bash
pnpm add qrcode-with-logos
```

**Usage:**
```typescript
import QrCodeWithLogo from 'qrcode-with-logos';

const qrCode = new QrCodeWithLogo({
  content: 'qr-payload-here',
  width: 300,
  logo: {
    src: '/cursor-logo.png',
    logoSize: 0.3, // 30% of QR size
    borderRadius: 8,
    borderSize: 2,
    borderColor: '#ffffff',
  },
  nodeQrCodeOptions: {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#18181b',
      light: '#ffffff',
    },
  },
});

// Render to canvas
await qrCode.toCanvas(document.getElementById('canvas'));

// Or get as data URL
const dataUrl = await qrCode.toDataURL();
```

**Pros:**
- Smaller bundle size
- Simple API
- Good for basic logo embedding

**Cons:**
- Less customization options
- Canvas-only output

---

## Backend Solution (For Email)

### Option A: `qr-code-styling` with Node.js (Recommended)

**Same library as frontend!** `qr-code-styling` supports Node.js via `jsdom` and `canvas`. This ensures visual consistency between dashboard and email QR codes.

Reference: [qr-code-styling Node.js example](https://github.com/kozakdenys/qr-code-styling-examples/blob/master/examples/nodejs/src/main.ts)

**Installation:**
```bash
pnpm add qr-code-styling canvas jsdom
```

**Implementation in `packages/core/src/business.server/events/qr-image.ts`:**

```typescript
import { JSDOM } from 'jsdom';
import nodeCanvas from 'canvas';
// Use CommonJS import for Node.js compatibility
const { QRCodeStyling } = require('qr-code-styling/lib/qr-code-styling.common.js');

type GenerateQRWithLogoOptions = {
  width?: number;
  logoUrl?: string;
};

export async function generateQRCodeWithLogo(
  qrCodeValue: string,
  options: GenerateQRWithLogoOptions = {}
): Promise<string> {
  const { width = 400, logoUrl = 'https://your-cdn.com/cursor-logo.png' } = options;

  const qrCode = new QRCodeStyling({
    jsdom: JSDOM,
    nodeCanvas,
    width,
    height: width,
    data: qrCodeValue,
    image: logoUrl,
    dotsOptions: {
      color: '#18181b',
      type: 'rounded',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      saveAsBlob: true,
      crossOrigin: 'anonymous',
      margin: 8,
      imageSize: 0.35,
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
    },
    cornersDotOptions: {
      type: 'dot',
    },
    qrOptions: {
      errorCorrectionLevel: 'H',
    },
  });

  const buffer = await qrCode.getRawData('png');
  return `data:image/png;base64,${buffer.toString('base64')}`;
}
```

**Pros:**
- Same library as frontend (visual consistency)
- Built-in logo support (no manual compositing)
- Rich customization options
- No Sharp native dependency issues
- `canvas` npm package is well-supported on Vercel

**Cons:**
- Requires `jsdom` and `canvas` dependencies
- Slightly larger bundle than Sharp-only approach

---

### Option B: `qrcode` + `sharp` (Alternative)

If you need maximum performance or already use Sharp elsewhere.

> **Vercel Note:** Sharp may require configuration. See [Deployment Considerations](#deployment-considerations-vercel).

**Installation:**
```bash
pnpm add sharp@0.32.6
```

**Implementation:**
```typescript
import QRCode from 'qrcode';
import sharp from 'sharp';

export async function generateQRCodeWithLogoSharp(
  qrCodeValue: string,
  logoPath: string,
  options: { width?: number; logoSizeRatio?: number } = {}
): Promise<string> {
  const { width = 400, logoSizeRatio = 0.3 } = options;

  const qrBuffer = await QRCode.toBuffer(qrCodeValue, {
    width,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#18181b', light: '#ffffff' },
  });

  const logoSize = Math.floor(width * logoSizeRatio);
  const logoPosition = Math.floor((width - logoSize) / 2);

  const resizedLogo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();

  const composited = await sharp(qrBuffer)
    .composite([{ input: resizedLogo, top: logoPosition, left: logoPosition }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${composited.toString('base64')}`;
}
```

**Pros:**
- High performance (native libvips)
- Full control over compositing

**Cons:**
- Native dependency (potential Vercel issues)
- Different rendering than frontend
- Manual logo positioning

---

## Deployment Considerations (Vercel)

### `qr-code-styling` + `canvas` (Recommended)

The `canvas` npm package (node-canvas) is generally well-supported on Vercel as it's commonly used for image generation. No special configuration typically needed.

### Sharp Compatibility (If using Option B)

Sharp uses native bindings which can cause issues with Vercel.

**Solutions if needed:**

1. **Pin Sharp version:**
   ```json
   "sharp": "0.32.6"
   ```

2. **Add to `vercel.json`:**
   ```json
   {
     "installCommand": "pnpm install && pnpm approve-builds"
   }
   ```

### Performance Comparison

| Approach | QR Generation Time | Vercel Compatible | Visual Consistency |
|----------|-------------------|-------------------|-------------------|
| `qr-code-styling` (node) | ~100ms | Yes | Frontend = Backend |
| `sharp` | ~50ms | Yes (with config) | Manual styling needed |

---

## Recommendation

### Unified Approach: `qr-code-styling` for Both Frontend and Backend

Use **`qr-code-styling`** everywhere for:
- **Visual consistency** - identical QR appearance in dashboard and emails
- **Built-in logo support** - no manual image compositing
- **Rich customization** - dot styles, colors, corners
- **TypeScript support** - type-safe configuration
- **Good Vercel compatibility** - uses `canvas` which is well-supported

### Frontend (Dashboard)
```typescript
import QRCodeStyling from 'qr-code-styling';
// Direct browser usage
```

### Backend (Email)
```typescript
const { QRCodeStyling } = require('qr-code-styling/lib/qr-code-styling.common.js');
// With jsdom + canvas for Node.js
```

**Alternative:** Use `sharp` only if you need maximum performance and already handle Sharp deployment issues elsewhere.

---

## Implementation Checklist

### Shared Setup
- [ ] Add Cursor logo to `apps/web/public/cursor-logo.png`
- [ ] Ensure `APP_BASE_URL` env var is set (e.g., `https://hackathon.example.com`)
- [ ] Create `packages/core/src/business.server/events/qr-config.ts` with shared styling

### Frontend (Dashboard)
- [ ] Install `qr-code-styling` in `apps/web`
- [ ] Create `QRCodeDisplay` React component
- [ ] Use `getLogoUrl(false)` for relative path
- [ ] Import `QR_STYLE_OPTIONS` from shared config
- [ ] Test scanning with various devices (iOS Camera, Android)

### Backend (Email)
- [ ] Install `qr-code-styling`, `canvas`, `jsdom` in `packages/core`
- [ ] Update `qr-image.ts` with `qr-code-styling` Node.js implementation
- [ ] Use `getLogoUrl(true)` for absolute URL
- [ ] Import `QR_STYLE_OPTIONS` from shared config
- [ ] Update welcome email templates to use new function
- [ ] Update VIP email templates
- [ ] Test email QR codes render correctly across email clients
- [ ] Test Vercel deployment

---

## Logo Asset Strategy

### Approach: Public Folder + URL Reference

Store logo in TanStack Start's public folder and reference via URL:

**File location:**
```
apps/web/public/
  └── cursor-logo.png   <- Single source of truth
```

**Access patterns:**
- Frontend: Relative path `/cursor-logo.png`
- Backend: Full URL `${APP_BASE_URL}/cursor-logo.png`

This works because:
1. Public folder is served at root URL on Vercel
2. `qr-code-styling` can fetch images via HTTP
3. No extra CDN infrastructure needed

---

## Shared Configuration

Create a shared config file for visual consistency:

**`packages/core/src/business.server/events/qr-config.ts`:**
```typescript
import { env } from '~/config/env';

// Logo URL helper - frontend uses relative, backend uses absolute
export function getLogoUrl(isServer: boolean): string {
  return isServer 
    ? `${env.APP_BASE_URL}/cursor-logo.png`
    : '/cursor-logo.png';
}

// Shared QR styling options
export const QR_STYLE_OPTIONS = {
  width: 400,
  height: 400,
  dotsOptions: {
    color: '#18181b',
    type: 'rounded' as const,
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    crossOrigin: 'anonymous' as const,
    margin: 8,
    imageSize: 0.35,
  },
  cornersSquareOptions: {
    type: 'extra-rounded' as const,
  },
  cornersDotOptions: {
    type: 'dot' as const,
  },
  qrOptions: {
    errorCorrectionLevel: 'H' as const,
  },
};
```

**Frontend usage:**
```typescript
import QRCodeStyling from 'qr-code-styling';
import { QR_STYLE_OPTIONS, getLogoUrl } from '@base/core/business.server/events/qr-config';

const qrCode = new QRCodeStyling({
  data: qrCodeValue,
  image: getLogoUrl(false), // '/cursor-logo.png'
  ...QR_STYLE_OPTIONS,
});
```

**Backend usage:**
```typescript
const { QRCodeStyling } = require('qr-code-styling/lib/qr-code-styling.common.js');
import { QR_STYLE_OPTIONS, getLogoUrl } from '~/business.server/events/qr-config';

const qrCode = new QRCodeStyling({
  jsdom: JSDOM,
  nodeCanvas,
  data: qrCodeValue,
  image: getLogoUrl(true), // 'https://hackathon.example.com/cursor-logo.png'
  ...QR_STYLE_OPTIONS,
});
```

This ensures identical QR appearance across dashboard and emails.

---

## Important Considerations

1. **Error Correction Level**: Always use 'H' (High) - allows 30% data recovery
2. **Logo Size**: Keep between 25-35% of QR size to ensure scannability
3. **Logo Shape**: Square or circular logos work best in center
4. **Testing**: Test with multiple scanner apps (iOS Camera, Android, dedicated apps)
5. **Contrast**: Maintain high contrast between QR dots and background
6. **Quiet Zone**: Maintain adequate margin around QR code edges

---

## Logo Asset Requirements

**Location:** `apps/web/public/cursor-logo.png`

The Cursor logo should be:
- **Format**: PNG with transparency or white background
- **Size**: At least 200x200px source (will be resized by library)
- **Shape**: Square aspect ratio preferred
- **Colors**: Works with dark QR dots (#18181b) on white background
- **File size**: Keep under 50KB for fast loading

