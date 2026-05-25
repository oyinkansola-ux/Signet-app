import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { useToast } from '../components/Toast';
import { Event } from '../types';

interface EventWithCount extends Event {
  attendee_count: number;
}

export function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    fetchDashboard();
  }, [authLoading]);

  const fetchDashboard = async () => {
    setLoading(true);
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventData) {
      const eventsWithCounts = await Promise.all(
        eventData.map(async (ev) => {
          const { count } = await supabase
            .from('attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', ev.id);
          return { ...ev, attendee_count: count || 0 };
        })
      );
      setEvents(eventsWithCounts);
    }
    setLoading(false);
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const totalAttendees = events.reduce((sum, e) => sum + e.attendee_count, 0);

  if (authLoading || loading) {
    return (
      <MobileLayout>
        <p className="text-tertiary text-sm">Loading...</p>
      </MobileLayout>
    );
  }

  const hasEvents = events.length > 0;

  return (
    <MobileLayout>
      {!hasEvents ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl border border-border p-12 max-w-[480px] w-full text-center animate-fade-in">
            <p className="text-tertiary font-medium text-[11px] tracking-[2px]">GET STARTED</p>
            <h2 className="font-medium text-2xl text-primary mt-4 mb-2">Create your first event</h2>
            <p className="text-secondary text-[15px] leading-relaxed mb-8">
              Set up an event, add your attendees, and generate beautiful branded passes in minutes.
            </p>
            <div className="space-y-2 text-left mb-8">
              {[
                'Generate unique QR passes for every attendee',
                'Download as PNG or PDF',
                'Scan passes at the door with any phone',
              ].map(text => (
                <div key={text} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-border rounded-full flex-shrink-0" />
                  <p className="text-secondary text-sm">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/create-event')}
              className="w-full h-11 text-sm font-medium bg-amber text-primary rounded-lg hover:bg-amber-dark transition-colors duration-150"
            >
              Create Your First Event
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <h1 className="font-medium text-3xl text-primary">Dashboard</h1>
          <p className="text-secondary text-[15px] mt-1 mb-10">
            Good to see you, {profile?.name || 'there'}.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-10">
            {[
              { num: events.length, label: 'Total Events' },
              { num: totalAttendees, label: 'Total Attendees' },
              { num: totalAttendees, label: 'Passes Generated' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-border rounded-xl p-6">
                <p className="font-medium text-4xl text-primary">{stat.num}</p>
                <p className="text-secondary text-[13px] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Events section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-lg text-primary">Your Events</h2>
            <button
              onClick={() => navigate('/create-event')}
              className="text-sm font-medium bg-amber text-primary px-5 py-2.5 rounded-lg hover:bg-amber-dark transition-colors duration-150"
            >
              Create Event
            </button>
          </div>

          <div className="space-y-2">
            {events.map(event => (
              <div
                key={event.id}
                className="bg-white border border-border rounded-xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-row-hover transition-colors duration-150 gap-3 md:gap-0"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 min-w-0">
                  <p className="font-medium text-[15px] text-primary truncate">{event.name}</p>
                  <p className="text-secondary text-sm">{formatEventDate(event.date)}</p>
                  <p className="text-secondary text-sm">{event.attendee_count} attendee{event.attendee_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      event.status === 'active'
                        ? 'bg-success-bg text-success'
                        : 'bg-page text-tertiary'
                    }`}
                  >
                    {event.status === 'active' ? 'Active' : 'Completed'}
                  </span>
                  <button
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="text-secondary text-sm hover:text-primary transition-colors duration-150"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/scan/${event.scan_token}`);
                      addToast('Scan link copied to clipboard');
                    }}
                    className="text-secondary text-sm hover:text-primary transition-colors duration-150"
                  >
                    Copy Scan Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
