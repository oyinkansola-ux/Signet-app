import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { PassCard } from '../components/PassCard';
import { useToast } from '../components/Toast';
import { Event, Attendee } from '../types';
import html2canvas from 'html2canvas';

export function EventOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [activeTab, setActiveTab] = useState<'attendees' | 'passes'>('attendees');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTicket, setEditTicket] = useState('');
  const [regenerateId, setRegenerateId] = useState<string | null>(null);
  const [regeneratedIds, setRegeneratedIds] = useState<Set<string>>(new Set());
  const [sendingPassId, setSendingPassId] = useState<string | null>(null);
  const passRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (id) fetchData();

    const channel = supabase
      .channel(`event-overview-${id}`)
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

  const formatEventDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const checkedIn = attendees.filter(a => a.status === 'used').length;
  const notArrived = attendees.filter(a => a.status === 'unused').length;
  const scanLink = event ? `${window.location.origin}/scan/${event.scan_token}` : '';

  const startEdit = (a: Attendee) => {
    setEditingId(a.id);
    setEditName(a.name);
    setEditEmail(a.email || '');
    setEditTicket(a.ticket_type);
  };

  const saveEdit = async (a: Attendee) => {
    await supabase.from('attendees').update({
      name: editName.trim(),
      email: editEmail.trim() || null,
      ticket_type: editTicket,
    }).eq('id', a.id);
    setEditingId(null);
    addToast('Attendee updated.', 'success');
    fetchData();
  };

  const confirmRegenerate = async (a: Attendee) => {
    const newQr = crypto.randomUUID();
    await supabase.from('attendees').update({ qr_code_data: newQr }).eq('id', a.id);
    setRegenerateId(null);
    setRegeneratedIds(prev => new Set(prev).add(a.id));
    addToast(`New pass generated for ${a.name}. Old pass is now invalid.`, 'success');
    fetchData();
  };

  const sendSinglePass = async (a: Attendee) => {
    if (!a.email) return;
    setSendingPassId(a.id);
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
          fileName: `${a.name.replace(/\s+/g, '-').toLowerCase()}-signet-pass.png`,
        },
      });

      if (error) {
        addToast('Failed to send pass. Please try again.', 'error');
      } else {
        await supabase.from('attendees').update({ pass_status: 'sent' }).eq('id', a.id);
        addToast(`Pass sent to ${a.email}`, 'success');
      }
    } catch {
      addToast('Failed to send pass. Please try again.', 'error');
    } finally {
      setSendingPassId(null);
    }
  };

  const formatScanTime = (iso: string | null) => {
    if (!iso) return '\u2014';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) return <MobileLayout><p className="text-tertiary text-sm">Loading...</p></MobileLayout>;
  if (!event) return <MobileLayout><p className="text-secondary">Event not found.</p></MobileLayout>;

  return (
    <MobileLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-medium text-3xl text-primary">{event.name}</h1>
            <p className="text-secondary text-[15px] mt-1">
              {formatEventDate(event.date)} &middot; {event.venue} &middot; {event.organiser_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/create-event?edit=${event.id}`)}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              Edit Event
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-10">
          {[
            { num: attendees.length, label: 'Total Attendees' },
            { num: checkedIn, label: 'Checked In' },
            { num: notArrived, label: 'Not Arrived' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-border rounded-xl p-6">
              <p className="font-medium text-4xl text-primary">{stat.num}</p>
              <p className="text-secondary text-[13px] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Door Scanner Section */}
        <div className="bg-white border border-border rounded-xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <p className="font-medium text-[15px] text-primary">Door Scanner</p>
            <p className="text-[13px] text-secondary mt-1">
              Share this link with the person checking in attendees. They open it on their phone — no login needed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(scanLink); addToast('Scan link copied to clipboard'); }}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-5 py-2 rounded-lg hover:bg-row-hover transition-colors duration-150">
              Copy Link
            </button>
            <button onClick={() => window.open(`/scan/${event.scan_token}`, '_blank')}
              className="text-sm text-tertiary hover:text-primary transition-colors duration-150">
              Open Scanner
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border mb-6">
          <button onClick={() => setActiveTab('attendees')}
            className={`text-sm font-medium pb-3 transition-colors ${activeTab === 'attendees' ? 'text-primary border-b-2 border-primary' : 'text-tertiary'}`}>
            Attendees
          </button>
          <button onClick={() => setActiveTab('passes')}
            className={`text-sm font-medium pb-3 transition-colors ${activeTab === 'passes' ? 'text-primary border-b-2 border-primary' : 'text-tertiary'}`}>
            Passes
          </button>
        </div>

        {/* Attendees Tab — Desktop Table */}
        {activeTab === 'attendees' && (
          <div>
            {/* Desktop table header */}
            <div className="hidden md:flex items-center text-[12px] font-medium text-tertiary tracking-wide pb-2 border-b border-border">
              <span className="w-1/5">Name</span>
              <span className="w-1/5">Email</span>
              <span className="w-[15%]">Ticket Type</span>
              <span className="w-[15%]">Status</span>
              <span className="w-[15%]">Checked In At</span>
              <span className="w-[15%] text-right">Actions</span>
            </div>
            {attendees.map(a => (
              <div key={a.id}>
                {editingId === a.id ? (
                  /* Edit Row */
                  <div className="bg-row-hover border-y border-primary py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="md:w-1/5 h-9 px-2 text-sm border-[1.5px] border-border rounded outline-none focus:border-primary" />
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email"
                      className="md:w-1/5 h-9 px-2 text-sm border-[1.5px] border-border rounded outline-none focus:border-primary" />
                    <select value={editTicket} onChange={e => setEditTicket(e.target.value)}
                      className="md:w-[15%] h-9 px-2 text-sm border-[1.5px] border-border rounded outline-none focus:border-primary bg-white">
                      <option>General</option><option>VIP</option><option>Speaker</option><option>Custom</option>
                    </select>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(a)}
                        className="text-sm font-medium text-primary border-[1.5px] border-primary px-4 py-1.5 rounded-lg hover:bg-row-hover transition-colors h-9">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-tertiary hover:text-primary transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Row */}
                    <div className="hidden md:flex items-center py-3.5 border-b border-border hover:bg-row-hover transition-colors duration-150">
                      <span className="w-1/5 font-medium text-sm text-primary">{a.name}</span>
                      <span className="w-1/5 text-[13px] text-secondary">{a.email || '\u2014'}</span>
                      <span className="w-[15%]"><TicketBadge type={a.ticket_type} /></span>
                      <span className="w-[15%]">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          a.status === 'used' ? 'bg-success-bg text-success' : 'bg-page text-tertiary'
                        }`}>
                          {a.status === 'used' ? 'Checked In' : 'Not Arrived'}
                        </span>
                      </span>
                      <span className="w-[15%] text-[13px] text-secondary">{formatScanTime(a.scanned_at)}</span>
                      <span className="w-[15%] flex justify-end gap-3">
                        {a.email && (
                          <button onClick={() => sendSinglePass(a)} disabled={sendingPassId === a.id}
                            className="text-[13px] text-tertiary hover:text-primary transition-colors disabled:opacity-50">
                            {sendingPassId === a.id ? 'Sending...' : 'Send Pass'}
                          </button>
                        )}
                        <button onClick={() => startEdit(a)} className="text-[13px] text-tertiary hover:text-primary transition-colors">Edit</button>
                        <button onClick={() => setRegenerateId(a.id)} className="text-[13px] text-tertiary hover:text-primary transition-colors">Regenerate</button>
                        {regeneratedIds.has(a.id) && (
                          <button className="text-[13px] text-success hover:underline transition-colors">Download New Pass</button>
                        )}
                      </span>
                    </div>
                    {/* Mobile Card */}
                    <div className="md:hidden bg-white border border-border rounded-xl p-4 mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm text-primary">{a.name}</p>
                        <TicketBadge type={a.ticket_type} />
                      </div>
                      <p className="text-[13px] text-secondary mb-1">{a.email || '\u2014'}</p>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          a.status === 'used' ? 'bg-success-bg text-success' : 'bg-page text-tertiary'
                        }`}>
                          {a.status === 'used' ? 'Checked In' : 'Not Arrived'}
                        </span>
                        {a.scanned_at && <span className="text-[13px] text-secondary">{formatScanTime(a.scanned_at)}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        {a.email && (
                          <button onClick={() => sendSinglePass(a)} disabled={sendingPassId === a.id}
                            className="text-[13px] text-tertiary hover:text-primary transition-colors disabled:opacity-50">
                            {sendingPassId === a.id ? 'Sending...' : 'Send Pass'}
                          </button>
                        )}
                        <button onClick={() => startEdit(a)} className="text-[13px] text-tertiary hover:text-primary transition-colors">Edit</button>
                        <button onClick={() => setRegenerateId(a.id)} className="text-[13px] text-tertiary hover:text-primary transition-colors">Regenerate</button>
                      </div>
                    </div>
                  </>
                )}
                {/* Regenerate Confirmation */}
                {regenerateId === a.id && (
                  <div className="bg-warn-bg border border-amber rounded-lg px-4 py-3 my-2 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                    <p className="text-sm text-primary">Regenerate pass for {a.name}? Their old QR code will stop working immediately.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => confirmRegenerate(a)}
                        className="text-sm font-medium text-primary border-[1.5px] border-primary px-4 py-1.5 rounded-lg hover:bg-row-hover transition-colors">
                        Yes, Regenerate
                      </button>
                      <button onClick={() => setRegenerateId(null)} className="text-sm text-tertiary hover:text-primary transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Passes Tab */}
        {activeTab === 'passes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attendees.map(a => (
              <div key={a.id} className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition-colors duration-150 relative">
                <div ref={el => { passRefs.current[a.id] = el; }}>
                  <PassCard event={event} attendee={a} />
                </div>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[13px] text-primary">{a.name}</p>
                    <TicketBadge type={a.ticket_type} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

function TicketBadge({ type }: { type: string }) {
  if (type === 'VIP') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-amber text-primary">VIP</span>;
  if (type === 'Speaker') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-primary text-white">Speaker</span>;
  return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-page text-secondary">{type}</span>;
}
