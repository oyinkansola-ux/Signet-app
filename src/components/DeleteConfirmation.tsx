import { useEffect, useState, useCallback } from 'react';

interface DeleteConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
}

export function DeleteConfirmation({ open, onClose, onConfirm, title, description, confirmLabel }: DeleteConfirmationProps) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, handleClose]);

  if (!visible) return null;

  const overlayAnim = closing ? 'animate-overlay-out' : 'animate-overlay-in';
  const isMobile = window.innerWidth < 768;

  return (
    <div
      className={`fixed inset-0 z-[200] ${overlayAnim} ${isMobile ? 'flex items-end' : 'flex items-center justify-center p-5'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {isMobile ? (
        <MobileDialog closing={closing} title={title} description={description} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={handleClose} />
      ) : (
        <DesktopDialog closing={closing} title={title} description={description} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={handleClose} />
      )}
    </div>
  );
}

function DesktopDialog({ closing, title, description, confirmLabel, onConfirm, onClose }: {
  closing: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div
      className={`w-full max-w-[420px] bg-white border border-border rounded-xl p-8 ${closing ? 'animate-dialog-out' : 'animate-dialog-in'}`}
    >
      <TrashIcon />
      <p className="font-medium text-[18px] text-primary mb-2">{title}</p>
      <p className="text-[14px] text-secondary mb-6" style={{ lineHeight: 1.6 }}>{description}</p>
      <div className="flex flex-col gap-2.5">
        <button
          onClick={onConfirm}
          className="w-full text-white text-[14px] font-medium rounded-lg py-3 px-6 transition-colors duration-150"
          style={{ background: '#C0392B' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#A93226'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#C0392B'; }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full text-secondary text-[14px] font-medium rounded-lg py-3 px-6 border-[1.5px] border-border bg-transparent transition-colors duration-150 hover:bg-page"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MobileDialog({ closing, title, description, confirmLabel, onConfirm, onClose }: {
  closing: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div
      className={`w-full bg-white border-t border-border ${closing ? 'animate-sheet-out' : 'animate-sheet-in'}`}
      style={{ borderRadius: '16px 16px 0 0', padding: `24px 20px calc(24px + env(safe-area-inset-bottom))` }}
    >
      <TrashIcon />
      <p className="font-medium text-[18px] text-primary mb-2">{title}</p>
      <p className="text-[14px] text-secondary mb-6" style={{ lineHeight: 1.6 }}>{description}</p>
      <div className="flex flex-col gap-2.5">
        <button
          onClick={onConfirm}
          className="w-full text-white text-[14px] font-medium rounded-lg py-3 px-6 transition-colors duration-150"
          style={{ background: '#C0392B' }}
          onTouchStart={(e) => { (e.target as HTMLElement).style.background = '#A93226'; }}
          onTouchEnd={(e) => { (e.target as HTMLElement).style.background = '#C0392B'; }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#A93226'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#C0392B'; }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full text-secondary text-[14px] font-medium rounded-lg py-3 px-6 border-[1.5px] border-border bg-transparent transition-colors duration-150 hover:bg-page"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg className="mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
