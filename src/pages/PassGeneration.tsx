import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { PassCard } from '../components/PassCard';
import { useToast } from '../components/Toast';
import { Event, Attendee } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function PassGeneration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const passRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (id) fetchData();

    // Realtime subscription for attendee status updates
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

  const fetchData = async () => {
    setLoading(true);
    const { data: eventData } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (eventData) setEvent(eventData);
    const { data: attData } = await supabase.from('attendees').select('*').eq('event_id', id).order('created_at');
    if (attData) setAttendees(attData);
    setLoading(false);
  };

  const downloadPng = async (attendeeId: string, name: string) => {
    const el = passRefs.current[attendeeId];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
    const link = document.createElement('a');
    link.download = `pass-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadPdf = async (attendeeId: string, name: string) => {
    const el = passRefs.current[attendeeId];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: event?.template === 1 ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`pass-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const hasEmails = attendees.some(a => a.email);
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
            <button className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              All as PNG (ZIP)
            </button>
            <button className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              All as PDF (ZIP)
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
                    <button onClick={() => downloadPng(a.id, a.name)}
                      className="text-xs font-medium text-tertiary hover:text-primary transition-colors px-3 py-1.5 rounded h-8">
                      PNG
                    </button>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Best for WhatsApp and image sharing
                    </div>
                  </div>
                  <div className="relative group">
                    <button onClick={() => downloadPdf(a.id, a.name)}
                      className="text-xs font-medium text-tertiary hover:text-primary transition-colors px-3 py-1.5 rounded h-8">
                      PDF
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

          {/* Option 1 — Email */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border gap-3">
            <div>
              <p className="font-medium text-sm text-primary">Email passes to attendees</p>
              <p className="text-[13px] text-secondary mt-1">Sends each pass directly to the attendee's email address.</p>
            </div>
            <div className="relative group">
              <button disabled={!hasEmails}
                className={`text-sm font-medium px-5 py-2 rounded-lg border-[1.5px] border-primary transition-colors duration-150 ${
                  hasEmails ? 'text-primary hover:bg-row-hover' : 'text-primary opacity-40 cursor-not-allowed'
                }`}>
                Send All Emails
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
