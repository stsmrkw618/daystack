import html2canvas from "html2canvas";

/**
 * Capture a DOM element as a canvas using html2canvas
 */
async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    backgroundColor: null,
    scale: 2, // Retina quality
    useCORS: true,
    logging: false,
  });
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

/**
 * Download the captured image
 */
export async function downloadShareImage(element: HTMLElement): Promise<void> {
  const canvas = await captureElement(element);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daystack-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy the captured image to clipboard.
 * Returns true if copied, false if fell back to download.
 */
export async function copyShareImage(element: HTMLElement): Promise<boolean> {
  const canvas = await captureElement(element);
  const blob = await canvasToBlob(canvas);

  // Check Clipboard API support
  if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      return true;
    } catch {
      // Fallback to download
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daystack-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return false;
}

/**
 * Share to Twitter/X: download the image + open Twitter intent
 */
export async function shareToTwitter(element: HTMLElement): Promise<void> {
  // Download image first so user can attach it
  await downloadShareImage(element);

  const text = encodeURIComponent(
    "今日のDayStack 📊\n#DayStack #ワークログ"
  );
  const url = encodeURIComponent("https://daystack-eosin.vercel.app");
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    "_blank",
    "noopener,noreferrer"
  );
}
