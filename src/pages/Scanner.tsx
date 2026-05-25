import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Event } from '../types';

interface ScanResult {
  result: 'valid' | 'already_used' | 'invalid';
  attendee?: { name: string; ticket_type: string; email?: string; scanned_at?: string };
  event?: { name: string };
}

export function Scanner() {
  const { scanToken } = useParams<{ scanToken: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [fading, setFading] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);

  useEffect(() => {
    fetchEvent();
  }, [scanToken]);

  useEffect(() => {
    if (scanning && event) startCamera();
    return () => { stopCamera(); };
  }, [scanning, event]);

  const fetchEvent = async () => {
    if (!scanToken) return;
    const { data } = await supabase.from('events').select('*').eq('scan_token', scanToken).maybeSingle();
    if (data) setEvent(data);
  };

  const startCamera = async () => {
    if (!scannerRef.current) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      setCameraError('');
    } catch (err: any) {
      setCameraError('Camera access is needed to scan passes. Please allow camera access in your browser settings.');
    }
  };

  const stopCamera = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (!scanToken) return;
    await stopCamera();
    setScanning(false);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/scan/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_code_data: decodedText, scan_token: scanToken }),
    });

    const data = await res.json();
    setScanResult(data);
  };

  const handleScanNext = () => {
    setFading(true);
    setTimeout(() => {
      setScanResult(null);
      setScanning(true);
      setFading(false);
    }, 200);
  };

  // Scan Result Screen
  if (scanResult) {
    return <ScanResultScreen result={scanResult} onScanNext={handleScanNext} fading={fading} />;
  }

  return (
    <div className="min-h-screen bg-nav flex flex-col items-center justify-center"
      style={{ paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
      {/* Top */}
      <div className="text-center px-6 py-5">
        <p className="font-medium text-base text-white">{event?.name || 'Event Scanner'}</p>
        <p className="text-[13px] text-tertiary mt-1.5">Point camera at attendee's pass</p>
      </div>

      {/* Camera / Viewfinder */}
      <div className="flex-1 flex items-center justify-center w-full relative" style={{ minHeight: '260px' }}>
        <div id="qr-reader" ref={scannerRef} className="w-full max-w-[300px]" />
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center">
              <p className="text-white/70 text-sm">Camera access is needed to scan passes.</p>
              <p className="text-white/50 text-xs mt-1">Please allow camera access in your browser settings.</p>
            </div>
          </div>
        )}
        {!cameraError && !scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Corner marks for viewfinder */}
            <div className="relative" style={{ width: 'min(260px, 70vw)', height: 'min(260px, 70vw)' }}>
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="py-6">
        <Logo color="#FFFFFF" size={20} showText />
      </div>
    </div>
  );
}

function ScanResultScreen({ result, onScanNext, fading }: { result: ScanResult; onScanNext: () => void; fading: boolean }) {
  const isValid = result.result === 'valid';
  const isAlreadyUsed = result.result === 'already_used';
  const bgColor = isValid ? 'bg-success' : 'bg-error';

  const TicketBadge = ({ type }: { type: string }) => {
    if (type === 'VIP') return <span className="px-4 py-1.5 text-[13px] font-medium rounded-full bg-amber text-primary">VIP</span>;
    if (type === 'Speaker') return <span className="px-4 py-1.5 text-[13px] font-medium rounded-full bg-nav text-white">Speaker</span>;
    return <span className="px-4 py-1.5 text-[13px] font-medium rounded-full bg-white text-success">{type}</span>;
  };

  return (
    <div className={`min-h-screen ${fading ? 'bg-nav' : bgColor} flex flex-col items-center justify-center transition-colors duration-200`}
      style={{ paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 32px)' }}>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center animate-flood">
          {isValid && (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {result.attendee?.ticket_type === 'VIP' && (
                <p className="font-medium text-[13px] text-amber mb-2">VIP</p>
              )}
              <p className="font-medium text-3xl text-white max-sm:text-[26px]">{result.attendee?.name}</p>
              <div className="mt-3"><TicketBadge type={result.attendee?.ticket_type || 'General'} /></div>
              <p className="text-base text-white/80 mt-3">Checked In</p>
            </>
          )}
          {isAlreadyUsed && (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <p className="font-medium text-2xl text-white">Already Checked In</p>
              <p className="text-lg text-white/80 mt-2">{result.attendee?.name}</p>
              {result.attendee?.scanned_at && (
                <p className="text-[13px] text-white/60 mt-1.5">
                  Scanned at {new Date(result.attendee.scanned_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </>
          )}
          {!isValid && !isAlreadyUsed && (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <p className="font-medium text-2xl text-white">Pass Not Recognised</p>
              <p className="text-[15px] text-white/70 mt-2">This QR code is not valid for this event.</p>
            </>
          )}
        </div>
      </div>
      <button onClick={onScanNext}
        className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-white border-[1.5px] border-white px-12 py-3.5 rounded-lg bg-transparent min-w-[200px] hover:bg-white hover:text-primary transition-colors duration-150"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 32px) + 32px)' }}>
        Scan Next
      </button>
    </div>
  );
}
