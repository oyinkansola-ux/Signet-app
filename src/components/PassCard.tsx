import { QRCode } from 'react-qr-code';
import { Event, Attendee } from '../types';

interface PassCardProps {
  event: Event;
  attendee: Attendee;
  scale?: number;
  className?: string;
}

export function PassCard({ event, attendee, scale = 1, className = '' }: PassCardProps) {
  const isBoarding = event.template === 1;
  const isMinimal = event.template === 2;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const ticketBadge = (type: string, small = false) => {
    const base = small ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
    if (type === 'VIP') return <span className={`${base} font-medium rounded-full bg-amber text-primary`}>VIP</span>;
    if (type === 'Speaker') return <span className={`${base} font-medium rounded-full bg-primary text-white`}>Speaker</span>;
    return <span className={`${base} font-medium rounded-full bg-page text-secondary`}>{type}</span>;
  };

  const qrData = attendee.qr_code_data || 'placeholder';

  if (isBoarding) {
    return (
      <div className={`bg-white rounded-xl border border-border overflow-hidden ${className}`}
        style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}>
        <div className="flex">
          <div className="flex-1 min-w-0">
            <div className="px-5 py-3" style={{ backgroundColor: event.brand_color || '#1C1C1E' }}>
              <p className="font-serif-italic text-white text-base truncate">{event.name || 'Event Name'}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px] text-secondary">
                {formatDate(event.date)}{event.time ? ` \u00B7 ${event.time}` : ''}
              </p>
              <p className="text-[13px] text-secondary mt-1">{event.venue || 'Venue'}</p>
              <p className="text-[12px] text-tertiary mt-2">{event.organiser_name || 'Organiser'}</p>
              <div className="mt-3 flex items-center gap-2">
                <p className="font-medium text-base text-primary">{attendee.name || 'Attendee Name'}</p>
                {ticketBadge(attendee.ticket_type, true)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-4 border-l border-dashed border-border">
            <div className="p-1.5 border-2 border-amber rounded-lg">
              <QRCode value={qrData} size={80} level="M" />
            </div>
            <p className="text-[12px] text-tertiary mt-1.5">#{attendee.pass_number || '0001'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimal) {
    return (
      <div className={`bg-white rounded-xl border border-border overflow-hidden ${className}`}
        style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}>
        <div className="h-3" style={{ backgroundColor: event.brand_color || '#1C1C1E' }} />
        <div className="px-5 py-4">
          <p className="font-serif-italic text-xl text-primary">{event.name || 'Event Name'}</p>
          <p className="text-[13px] text-secondary mt-1">
            {formatDate(event.date)}{event.time ? ` \u00B7 ${event.time}` : ''}
          </p>
          <p className="text-[13px] text-secondary mt-0.5">{event.venue || 'Venue'}</p>
          <p className="text-[12px] text-tertiary mt-1">{event.organiser_name || 'Organiser'}</p>
          <div className="mt-3 flex items-center gap-2">
            <p className="font-medium text-base text-primary">{attendee.name || 'Attendee Name'}</p>
            {ticketBadge(attendee.ticket_type, true)}
          </div>
        </div>
        <div className="flex items-center justify-center px-5 pb-4">
          <div className="p-1.5 border-2 border-amber rounded-lg">
            <QRCode value={qrData} size={80} level="M" />
          </div>
        </div>
        <p className="text-center text-[12px] text-tertiary pb-2">#{attendee.pass_number || '0001'}</p>
      </div>
    );
  }

  // Bold Banner (template 3)
  return (
    <div className={`bg-white rounded-xl border border-border overflow-hidden ${className}`}
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}>
      <div className="px-5 py-6" style={{ backgroundColor: event.brand_color || '#1C1C1E' }}>
        <p className="font-serif-italic text-2xl text-white">{event.name || 'Event Name'}</p>
        <p className="text-[13px] text-white/70 mt-1">
          {formatDate(event.date)}{event.time ? ` \u00B7 ${event.time}` : ''}
        </p>
        <p className="text-[13px] text-white/70 mt-0.5">{event.venue || 'Venue'}</p>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="font-medium text-base text-primary">{attendee.name || 'Attendee Name'}</p>
          {ticketBadge(attendee.ticket_type, true)}
        </div>
        <p className="text-[12px] text-tertiary mt-1">{event.organiser_name || 'Organiser'}</p>
        <div className="mt-3 flex items-center justify-center">
          <div className="p-1.5 border-2 border-amber rounded-lg">
            <QRCode value={qrData} size={72} level="M" />
          </div>
        </div>
        <p className="text-center text-[12px] text-tertiary mt-1">#{attendee.pass_number || '0001'}</p>
      </div>
    </div>
  );
}
