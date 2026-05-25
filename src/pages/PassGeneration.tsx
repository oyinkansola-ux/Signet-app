import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { PassCard } from '../components/PassCard';
import { useToast } from '../components/Toast';
import { Event, Attendee } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

export function PassGeneration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const passRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [downloadingPng, setDownloadingPng] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingZipPng, setDownloadingZipPng] = useState(false);
  const [downloadingZipPdf, setDownloadingZipPdf] = useState(false);
  const [emailConfirmVisible, setEmailConfirmVisible] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState('');
  const [resendConfigured, setResendConfigured] = useState(true);

  useEffect(() => {
    if (id) fetchData();
    checkResendConfig();

    const channel = supabase
      .channel(`passes-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendees', filter: `event_id=eq.${id}` },
        (payload) => {
          setAttendees(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const checkResendConfig = async () => {
    try {
      const { data } = await supabase.functions.invoke('send-pass-email', {
        body: { action: 'check' },
      });
      setResendConfigured(data?.configured ?? false);
    } catch {
      setResendConfigured(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: eventData } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (eventData) setEvent(eventData);
    const { data: attData } = await supabase.from('attendees').select('*').eq('event_id', id).order('created_at');
    if (attData) setAttendees(attData);
    setLoading(false);
  };

  const slugifyName = (name: string) => name.replace(/\s+/g, '-').toLowerCase();

  const downloadPng = async (attendeeId: string, name: string) => {
    const el = passRefs.current[attendeeId];
    if (!el) return;
    setDownloadingPng(attendeeId);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as (b: Blob | null) => void, 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${slugifyName(name)}-signet-pass.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      addToast('Pass downloaded as PNG', 'success');
    } catch {
      addToast('Failed to download PNG', 'error');
    } finally {
      setDownloadingPng(null);
    }
  };

  const downloadPdf = async (attendeeId: string, name: string) => {
    const el = passRefs.current[attendeeId];
    if (!el) return;
    setDownloadingPdf(attendeeId);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
      const imgData = canvas.toDataURL('image/png');
      const orientation = event?.template === 1 ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width + 40, canvas.height + 40] });
      pdf.addImage(imgData, 'PNG', 20, 20, canvas.width, canvas.height);
      pdf.save(`${slugifyName(name)}-signet-pass.pdf`);
      addToast('Pass downloaded as PDF', 'success');
    } catch {
      addToast('Failed to download PDF', 'error');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const downloadAllPngZip = async () => {
    setDownloadingZipPng(true);
    try {
      const zip = new JSZip();
      for (const a of attendees) {
        const el = passRefs.current[a.id];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as (b: Blob | null) => void, 'image/png'));
        zip.file(`${slugifyName(a.name)}-signet-pass.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `${slugifyName(event?.name || 'event')}-all-passes-png.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      addToast('All passes downloading as ZIP', 'success');
    } catch {
      addToast('Failed to download ZIP', 'error');
    } finally {
      setDownloadingZipPng(false);
    }
  };

  const downloadAllPdfZip = async () => {
    setDownloadingZipPdf(true);
    try {
      const zip = new JSZip();
      for (const a of attendees) {
        const el = passRefs.current[a.id];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
        const imgData = canvas.toDataURL('image/png');
        const orientation = event?.template === 1 ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width + 40, canvas.height + 40] });
        pdf.addImage(imgData, 'PNG', 20, 20, canvas.width, canvas.height);
        const pdfBlob = pdf.output('arraybuffer');
        zip.file(`${slugifyName(a.name)}-signet-pass.pdf`, pdfBlob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `${slugifyName(event?.name || 'event')}-all-passes-pdf.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      addToast('All passes downloading as ZIP', 'success');
    } catch {
      addToast('Failed to download ZIP', 'error');
    } finally {
      setDownloadingZipPdf(false);
    }
  };

  const sendAllEmails = async () => {
    setEmailConfirmVisible(false);
    const withEmail = attendees.filter(a => a.email);
    if (withEmail.length === 0) {
      addToast('No email addresses found for these attendees. Add emails when creating attendees to use this feature.', 'error');
      return;
    }

    setSendingEmails(true);
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < withEmail.length; i++) {
      const a = withEmail[i];
      setEmailProgress(`Sending passes... ${i + 1} of ${withEmail.length}`);
      try {
        const el = passRefs.current[a.id];
        let pngBase64 = '';
        if (el) {
          const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
          pngBase64 = canvas.toDataURL('image/png').split(',')[1];
        }

        const { error } = await supabase.functions.invoke('send-pass-email', {
          body: {
            action: 'send',
            to: a.email,
            attendeeName: a.name,
            eventName: event?.name,
            eventDate: event?.date,
            eventTime: event?.time,
            venue: event?.venue,
            organiserName: event?.organiser_name,
            pngBase64,
            fileName: `${slugifyName(a.name)}-signet-pass.png`,
          },
        });

        if (error) {
          failed++;
        } else {
          succeeded++;
          await supabase.from('attendees').update({ pass_status: 'sent' }).eq('id', a.id);
        }
      } catch {
        failed++;
      }
    }

    setSendingEmails(false);
    setEmailProgress('');

    if (succeeded > 0 && failed === 0) {
      addToast(`Passes sent to ${succeeded} attendees`, 'success');
    } else if (succeeded > 0 && failed > 0) {
      addToast(`Passes sent. ${succeeded} succeeded, ${failed} failed.`, 'info');
    } else {
      addToast('Something went wrong. Please try again.', 'error');
    }
  };

  const hasEmails = attendees.some(a => a.email);
  const attendeesWithEmail = attendees.filter(a => a.email).length;
  const scanLink = event ? `${window.location.origin}/scan/${event.scan_token}` : '';

  const getStatusBadge = (a: Attendee) => {
    const ps = (a as any).pass_status || (a.status === 'used' ? 'checked_in' : 'not_sent');
    if (ps === 'checked_in') return <span className="px-2.5 py-[3px] text-[11px] font-medium rounded-full bg-primary text-white transition-all duration-300">Checked In</span>;
    if (ps === 'sent') return <span className="px-2.5 py-[3px] text-[11px] font-medium rounded-full bg-success-bg text-success transition-all duration-300">Sent</span>;
    return <span className="px-2.5 py-[3px] text-[11px] font-medium rounded-full bg-page text-tertiary transition-all duration-300">Not Sent</span>;
  };

  if (loading) {
    return <MobileLayout><p className="text-tertiary text-sm">Loading...</p></MobileLayout>;
  }

  if (!event) {
    return <MobileLayout><p className="text-secondary">Event not found.</p></MobileLayout>;
  }

  return (
    <MobileLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
          <h1 className="font-medium text-3xl text-primary">Your Passes</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/event/${event.id}`)}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              View Event
            </button>
          </div>
        </div>
        <p className="text-secondary text-[15px] mb-10">
          {attendees.length} passes generated for {event.name}
        </p>

        {/* Download All Section */}
        <div className="bg-white border border-border rounded-xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <p className="font-medium text-[15px] text-primary">Download All Passes</p>
            <p className="text-[13px] text-secondary mt-1">{attendees.length} passes ready</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadAllPngZip} disabled={downloadingZipPng}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {downloadingZipPng && <Spinner />}
              {downloadingZipPng ? 'Generating...' : 'All as PNG (ZIP)'}
            </button>
            <button onClick={downloadAllPdfZip} disabled={downloadingZipPdf}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {downloadingZipPdf && <Spinner />}
              {downloadingZipPdf ? 'Generating...' : 'All as PDF (ZIP)'}
            </button>
          </div>
        </div>

        {/* Pass Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {attendees.map(a => (
            <div key={a.id} className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition-colors duration-150 relative">
              <div className="absolute top-3 right-3 z-10">{getStatusBadge(a)}</div>
              <div ref={el => { passRefs.current[a.id] = el; }}>
                <PassCard event={event} attendee={a} />
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[13px] text-primary">{a.name}</p>
                  <TicketBadge type={a.ticket_type} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button onClick={() => downloadPng(a.id, a.name)} disabled={downloadingPng === a.id}
                      className="text-xs font-medium text-tertiary hover:text-primary transition-colors px-3 py-1.5 rounded h-8 disabled:opacity-50 flex items-center gap-1">
                      {downloadingPng === a.id && <Spinner small />}
                      {downloadingPng === a.id ? 'Generating...' : 'PNG'}
                    </button>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Best for WhatsApp and image sharing
                    </div>
                  </div>
                  <div className="relative group">
                    <button onClick={() => downloadPdf(a.id, a.name)} disabled={downloadingPdf === a.id}
                      className="text-xs font-medium text-tertiary hover:text-primary transition-colors px-3 py-1.5 rounded h-8 disabled:opacity-50 flex items-center gap-1">
                      {downloadingPdf === a.id && <Spinner small />}
                      {downloadingPdf === a.id ? 'Generating...' : 'PDF'}
                    </button>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Best for printing or email attachments
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Share Section */}
        <div className="mt-12 bg-white border border-border rounded-xl p-6">
          <h3 className="font-medium text-lg text-primary mb-5">Share Passes</h3>

          {!resendConfigured && (
            <div className="mb-5 bg-page border border-border rounded-lg px-4 py-3 text-[13px] text-secondary">
              Email sending is not configured yet. Download passes and share them manually.
            </div>
          )}

          {/* Email Confirmation Bar */}
          {emailConfirmVisible && (
            <div className="mb-5 flex items-center justify-between gap-3 animate-fade-in"
              style={{ background: '#FFFBF2', border: '1px solid #E8A020', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '14px', color: '#1C1C1E' }}>
                Send passes to {attendeesWithEmail} attendees with email addresses?
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={sendAllEmails} disabled={sendingEmails}
                  className="text-sm font-medium text-primary border-[1.5px] border-primary px-4 py-1.5 rounded-lg hover:bg-row-hover transition-colors disabled:opacity-50">
                  Yes, Send
                </button>
                <button onClick={() => setEmailConfirmVisible(false)} disabled={sendingEmails}
                  className="text-sm text-tertiary hover:text-primary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sending Progress */}
          {emailProgress && (
            <p className="text-center mb-4" style={{ fontSize: '14px', color: '#6B6B6B' }}>
              {emailProgress}
            </p>
          )}

          {/* Option 1 — Email */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border gap-3">
            <div>
              <p className="font-medium text-sm text-primary">Email passes to attendees</p>
              <p className="text-[13px] text-secondary mt-1">Sends each pass directly to the attendee's email address.</p>
            </div>
            <div className="relative group">
              <button disabled={!hasEmails || !resendConfigured || sendingEmails}
                onClick={() => {
                  if (!hasEmails) {
                    addToast('No email addresses found for these attendees. Add emails when creating attendees to use this feature.', 'error');
                    return;
                  }
                  setEmailConfirmVisible(true);
                }}
                className={`text-sm font-medium px-5 py-2 rounded-lg border-[1.5px] border-primary transition-colors duration-150 ${
                  hasEmails && resendConfigured ? 'text-primary hover:bg-row-hover' : 'text-primary opacity-40 cursor-not-allowed'
                }`}>
                {sendingEmails ? 'Sending...' : 'Send All Emails'}
              </button>
              {!hasEmails && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  No email addresses were provided
                </div>
              )}
            </div>
          </div>

          {/* Option 2 — Copy Pass Links */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border gap-3">
            <div>
              <p className="font-medium text-sm text-primary">Share individual pass links</p>
              <p className="text-[13px] text-secondary mt-1">Each attendee gets a unique link to their own pass.</p>
            </div>
            <button onClick={() => {
              const links = attendees.map(a => `${window.location.origin}/pass/${a.qr_code_data}`).join('\n');
              navigator.clipboard.writeText(links);
              addToast('Pass links copied — share each one individually');
            }} className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              Copy All Links
            </button>
          </div>

          {/* Option 3 — Door Scanner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-3">
            <div>
              <p className="font-medium text-sm text-primary">Open door scanner</p>
              <p className="text-[13px] text-secondary mt-1">Share this link with whoever is checking people in at the door.</p>
            </div>
            <button onClick={() => {
              navigator.clipboard.writeText(scanLink);
              addToast('Scanner link copied to clipboard');
            }} className="text-sm text-tertiary hover:text-primary transition-colors duration-150">
              Copy Scanner Link
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function TicketBadge({ type }: { type: string }) {
  if (type === 'VIP') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-amber text-primary">VIP</span>;
  if (type === 'Speaker') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-primary text-white">Speaker</span>;
  return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-page text-secondary">{type}</span>;
}

function Spinner({ small }: { small?: boolean } = {}) {
  return (
    <svg className={`animate-spin ${small ? 'w-3 h-3' : 'w-4 h-4'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
