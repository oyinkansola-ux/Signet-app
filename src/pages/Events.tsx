import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { useToast } from '../components/Toast';
import { Search } from 'lucide-react';
import { Event } from '../types';

interface EventWithCounts extends Event {
  attendee_count: number;
  checked_in_count: number;
}

type Filter = 'all' | 'active' | 'completed';

export function Events() {
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (authLoading) return;
    fetchEvents();
  }, [authLoading]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventData) {
      const withCounts = await Promise.all(eventData.map(async (ev) => {
        const { count: total } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('event_id', ev.id);
        const { count: checkedIn } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('event_id', ev.id).eq('status', 'used');
        return { ...ev, attendee_count: total || 0, checked_in_count: checkedIn || 0 };
      }));
      setEvents(withCounts);
    }
    setLoading(false);
  };

  const formatEventDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const filtered = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'active' && e.status === 'active') || (filter === 'completed' && e.status !== 'active');
    return matchesSearch && matchesFilter;
  });

  return (
    <MobileLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-medium text-3xl text-primary">Events</h1>
          <button onClick={() => navigate('/create-event')}
            className="text-sm font-medium bg-amber text-primary px-5 py-2.5 rounded-lg hover:bg-amber-dark transition-colors duration-150">
            Create New Event
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full h-11 pl-10 pr-4 text-[15px] rounded-lg border-[1.5px] border-border focus:border-primary outline-none transition-colors duration-150" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                filter === f ? 'bg-primary text-white' : 'bg-page text-secondary hover:bg-border'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-tertiary text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-secondary text-[15px] text-center mt-20">
            {events.length === 0 ? 'No events yet. Create your first one.' : 'No events match your search.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(event => (
              <div key={event.id}
                className="bg-white border border-border rounded-xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between hover:border-primary transition-colors duration-150 gap-4 cursor-pointer"
                onClick={() => navigate(`/event/${event.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base text-primary truncate">{event.name}</p>
                  <p className="text-[13px] text-secondary mt-1">{formatEventDate(event.date)} &middot; {event.venue}</p>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-right md:text-left">
                    <p className="text-sm text-secondary">{event.attendee_count} attendee{event.attendee_count !== 1 ? 's' : ''}</p>
                    <p className="text-[13px] text-tertiary">{event.checked_in_count} checked in</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    event.status === 'active' ? 'bg-success-bg text-success' : 'bg-page text-tertiary'
                  }`}>
                    {event.status === 'active' ? 'Active' : 'Completed'}
                  </span>
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/event/${event.id}`)}
                      className="text-secondary text-sm hover:text-primary transition-colors duration-150">View</button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/scan/${event.scan_token}`);
                      addToast('Scan link copied to clipboard');
                    }} className="text-secondary text-sm hover:text-primary transition-colors duration-150">Copy Scan Link</button>
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
