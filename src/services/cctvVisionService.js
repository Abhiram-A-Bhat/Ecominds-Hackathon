const DEMO_IMAGE_URL = '/cctv/classroom-empty-demo.jpg';

async function asDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not load the classroom demo image.'));
    reader.readAsDataURL(blob);
  });
}

export async function inspectClassroomDemo() {
  const imageResponse = await fetch(DEMO_IMAGE_URL);
  if (!imageResponse.ok) throw new Error('The empty-classroom demo image could not be loaded.');
  const image = await asDataUrl(await imageResponse.blob());

  const response = await fetch('/api/cctv/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
    signal: AbortSignal.timeout(35000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(payload.detail || 'The vision model could not inspect the demo image.');
  }
  return payload;
}
