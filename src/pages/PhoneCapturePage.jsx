import React, { useRef, useState } from 'react';
import { CameraIcon as Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { ArrowLeftIcon as ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Link } from '../router/Router';
import { classifyPhoneCapture } from '../services/aiVisionService';
import { BrandMark } from '../components/shell/BrandMark';

function compressCapture(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.onerror = () => reject(new Error('This photo could not be opened. Choose another image.'));
    image.src = dataUrl;
  });
}

export function PhoneCapturePage() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState('');

  const handleCapture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image from your camera or photo library.');
      event.target.value = '';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Choose a photo smaller than 15 MB.');
      event.target.value = '';
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const image = await compressCapture(String(reader.result || ''));
        setPreview(image);
        setResult(await classifyPhoneCapture(image));
      } catch (issue) {
        setError(issue.message || 'The laptop classifier could not analyze this photo.');
      } finally {
        setBusy(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setError('The phone could not read that photo. Please try again.');
      setBusy(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="phone-capture-page">
      <header className="phone-capture-brand">
        <BrandMark size={42} />
        <div>
          <strong>Ecominds · RNSIT</strong>
          <span>Phone photo intake</span>
        </div>
      </header>

      <section className="phone-capture-card">
        <div className="phone-capture-eyebrow">Laptop-connected waste classifier</div>
        <h1>Photograph one item</h1>
        <p className="phone-capture-copy">Take a clear photo of one waste item. It will be sent over your local Wi-Fi to the Ecominds classifier running on the laptop.</p>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="sr-only" aria-label="Take or choose a waste photo" />
        <button type="button" className="phone-capture-button" onClick={() => inputRef.current?.click()} disabled={busy} aria-busy={busy}>
          <Camera size={19} weight="bold" />
          {busy ? 'Sending photo to laptop…' : 'Take photo'}
        </button>

        {error && <p className="phone-capture-error" role="alert">{error}</p>}
        {preview && <img className="phone-capture-preview" src={preview} alt="Photo sent for classification" />}
        {busy && <p className="phone-capture-status" role="status">The laptop is analyzing your photo. Keep this page open.</p>}
        {result && (
          <section className="phone-capture-result" aria-live="polite">
            <div className="phone-capture-eyebrow">Classifier result</div>
            <h2>{result.name}</h2>
            <p>{result.category}</p>
            <div className="phone-capture-confidence">Object detection score: <strong>{result.confidence}</strong></div>
            <p className="phone-capture-note">This is a general object detector mapped to campus disposal guidance. Its score is not a validated measure of material-classification accuracy.</p>
            <div className="phone-capture-destination"><strong>Suggested destination</strong><span>{result.targetBin}</span></div>
            <p className="phone-capture-note">Please verify hazardous or ambiguous items with campus staff before disposal.</p>
          </section>
        )}

        <Link className="phone-capture-back" to="/scanner"><ArrowLeft size={16} /> Back to scanner</Link>
      </section>
      <footer className="phone-capture-footnote">Use the same Wi-Fi as the laptop. The photo is sent only when you tap Take photo.</footer>
    </main>
  );
}
