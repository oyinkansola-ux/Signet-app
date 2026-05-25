import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { PassCard } from '../components/PassCard';
import { useToast } from '../components/Toast';
import { Event, Attendee } from '../types';
import Papa from 'papaparse';

type Step = 1 | 2 | 3;

const CURATED_COLORS = [
  '#1C1C1E', '#3D3D3D', '#5C5C5C', '#8B7355',
  '#2D4A3E', '#1B4332', '#2D3561', '#4A3728',
  '#8B2635', '#6B4226', '#4A5568', '#2C3E50',
];

const TEMPLATES = [
  { id: 1, name: 'Boarding Pass', desc: 'Horizontal layout. Info left. QR right. Dashed center divider.' },
  { id: 2, name: 'Minimal Stripe', desc: 'Vertical. Bold color stripe header. Clean white body. QR at bottom.' },
  { id: 3, name: 'Bold Banner', desc: 'Vertical. Top half filled with brand color and event name. Bottom half white.' },
];

const STEP_LABELS = ['Details', 'Branding', 'Attendees'];

export function CreateEvent() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [step, setStep] = useState<Step>(1);
  const [loaded, setLoaded] = useState(false);

  // Step 1 fields
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [organiserName, setOrganiserName] = useState(profile?.name || '');
  const [description, setDescription] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 fields
  const [brandColor, setBrandColor] = useState('#1C1C1E');
  const [previewColor, setPreviewColor] = useState('#1C1C1E');
  const [customColor, setCustomColor] = useState('');
  const [template, setTemplate] = useState(1);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 3 fields
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [ticketType, setTicketType] = useState('General');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});
  const [csvState, setCsvState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [csvCount, setCsvCount] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Preview attendee tracking
  const [previewIndex, setPreviewIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Load existing event for editing
  useEffect(() => {
    if (editId && !loaded) {
      loadEventData(editId);
    }
  }, [editId, loaded]);

  const loadEventData = async (id: string) => {
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (ev) {
      setEventName(ev.name);
      setEventDate(ev.date);
      setEventTime(ev.time);
      setVenue(ev.venue);
      setOrganiserName(ev.organiser_name);
      setDescription(ev.description || '');
      setBrandColor(ev.brand_color);
      setPreviewColor(ev.brand_color);
      setTemplate(ev.template);
      setBannerUrl(ev.banner_url || '');
    }
    const { data: atts } = await supabase.from('attendees').select('*').eq('event_id', id).order('created_at');
    if (atts) {
      setAttendees(atts);
      setPreviewIndex(atts.length - 1);
    }
    setLoaded(true);
  };

  // Flip animation when new attendee added
  useEffect(() => {
    if (attendees.length > 1) {
      setFlipping(true);
      setPreviewIndex(attendees.length - 1);
      const t = setTimeout(() => setFlipping(false), 400);
      return () => clearTimeout(t);
    }
  }, [attendees.length]);

  const previewEvent: Event = {
    id: editId || 'preview',
    user_id: '',
    name: eventName,
    date: eventDate,
    time: eventTime,
    venue,
    organiser_name: organiserName,
    description,
    brand_color: previewColor,
    template,
    banner_url: bannerUrl,
    scan_token: '',
    status: 'active',
    created_at: '',
  };

  const currentPreviewAttendee: Attendee = attendees.length > 0
    ? attendees[previewIndex] || attendees[attendees.length - 1]
    : {
        id: 'preview', event_id: 'preview', name: 'Attendee Name', email: '',
        ticket_type: 'General', pass_number: '0001', qr_code_data: 'preview-qr-code',
        status: 'unused', scanned_at: null, created_at: '',
      };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!eventName.trim()) e.name = 'Event name is required';
    if (!eventDate) e.date = 'Please select a date';
    if (!eventTime) e.time = 'Please select a time';
    if (!venue.trim()) e.venue = 'Venue is required';
    if (!organiserName.trim()) e.organiser = 'Organiser name is required';
    setStep1Errors(e);
    return Object.keys(e).length === 0;
  };

  const addAttendee = () => {
    const e: Record<string, string> = {};
    if (!attendeeName.trim()) e.name = "Please enter the attendee's name";
    if (attendeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) e.email = "That doesn't look like a valid email";
    setStep3Errors(e);
    if (Object.keys(e).length > 0) return;

    const newAttendee: Attendee = {
      id: `temp-${Date.now()}-${Math.random()}`,
      event_id: 'preview',
      name: attendeeName.trim(),
      email: attendeeEmail.trim(),
      ticket_type: ticketType,
      pass_number: String(attendees.length + 1).padStart(4, '0'),
      qr_code_data: `temp-${Date.now()}-${Math.random()}`,
      status: 'unused',
      scanned_at: null,
      created_at: new Date().toISOString(),
    };
    setAttendees(prev => [...prev, newAttendee]);
    setAttendeeName('');
    setAttendeeEmail('');
    setTicketType('General');
  };

  const removeAttendee = (id: string) => {
    setAttendees(prev => prev.filter(a => a.id !== id));
    if (previewIndex >= attendees.length - 1) setPreviewIndex(Math.max(0, attendees.length - 2));
  };

  const handleCsvUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) { setCsvState('error'); return; }
    setCsvState('loading');
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const newAttendees = rows.map((row, i) => ({
          id: `csv-${Date.now()}-${i}`,
          event_id: 'preview',
          name: (row.name || row.Name || row['Full Name'] || '').trim(),
          email: (row.email || row.Email || '').trim(),
          ticket_type: (row.ticket_type || row['Ticket Type'] || row['Ticket'] || 'General').trim(),
          pass_number: String(attendees.length + i + 1).padStart(4, '0'),
          qr_code_data: `csv-${Date.now()}-${i}`,
          status: 'unused', scanned_at: null, created_at: new Date().toISOString(),
        })).filter(a => a.name);
        if (newAttendees.length === 0) { setCsvState('error'); return; }
        setAttendees(prev => [...prev, ...newAttendees]);
        setCsvCount(newAttendees.length);
        setCsvState('success');
      },
      error: () => { setCsvState('error'); },
    });
  };

  const downloadCsvTemplate = () => {
    const csv = 'name,email,ticket_type\nJohn Doe,john@example.com,General\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'signet-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBannerUpload = async (file: File) => {
    setBannerFile(file);
    setBannerUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (attendees.length === 0) return;

    if (isEditing && editId) {
      // Update existing event
      const { error: evErr } = await supabase.from('events').update({
        name: eventName.trim(), date: eventDate, time: eventTime,
        venue: venue.trim(), organiser_name: organiserName.trim(),
        description: description.trim(), brand_color: brandColor, template,
      }).eq('id', editId);

      if (evErr) { addToast('Failed to update event.', 'error'); return; }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `banners/${editId}.${ext}`;
        await supabase.storage.from('banners').upload(path, bannerFile, { upsert: true });
        const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
        await supabase.from('events').update({ banner_url: urlData.publicUrl }).eq('id', editId);
      }

      // Sync attendees: remove old, insert new
      await supabase.from('attendees').delete().eq('event_id', editId);
      const inserts = attendees.map((a, i) => ({
        event_id: editId, name: a.name, email: a.email || null,
        ticket_type: a.ticket_type, pass_number: String(i + 1).padStart(4, '0'),
      }));
      await supabase.from('attendees').insert(inserts);

      addToast('Event updated. Passes regenerated.', 'success');
      navigate(`/event/${editId}`);
      return;
    }

    // Create new event
    const { data: eventData, error: eventError } = await supabase.from('events').insert({
      user_id: profile!.id, name: eventName.trim(), date: eventDate, time: eventTime,
      venue: venue.trim(), organiser_name: organiserName.trim(),
      description: description.trim(), brand_color: brandColor, template,
    }).select().maybeSingle();

    if (eventError || !eventData) { addToast('Failed to create event.', 'error'); return; }

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop();
      const path = `banners/${eventData.id}.${ext}`;
      await supabase.storage.from('banners').upload(path, bannerFile);
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
      await supabase.from('events').update({ banner_url: urlData.publicUrl }).eq('id', eventData.id);
    }

    const inserts = attendees.map((a, i) => ({
      event_id: eventData.id, name: a.name, email: a.email || null,
      ticket_type: a.ticket_type, pass_number: String(i + 1).padStart(4, '0'),
    }));
    const { error: attError } = await supabase.from('attendees').insert(inserts).select();
    if (attError) { addToast('Event created but attendees failed.', 'error'); return; }

    addToast('Event created successfully!', 'success');
    navigate(`/event/${eventData.id}/passes`);
  };

  const inputClass = (errorKey?: string) =>
    `w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] outline-none transition-colors duration-150 ${
      errorKey && step1Errors[errorKey] ? 'border-error' : 'border-border focus:border-primary'
    }`;

  const secondaryBtn = 'text-sm font-medium text-primary border-[1.5px] border-primary px-6 py-2.5 rounded-lg hover:bg-row-hover transition-colors duration-150';
  const ghostBtn = 'text-sm text-tertiary hover:text-primary transition-colors duration-150';

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <MobileLayout>
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-0px)] md:overflow-hidden -m-5 md:m-0">
        {/* Left Panel */}
        <div className="w-full md:w-[420px] bg-white p-6 md:p-10 md:overflow-y-auto flex-shrink-0">
          {/* Desktop Step Indicator */}
          <div className="hidden md:flex gap-6 mb-10">
            {STEP_LABELS.map((label, i) => {
              const stepNum = (i + 1) as Step;
              const isCompleted = stepNum < step;
              const isCurrent = stepNum === step;
              return (
                <span key={label} className={`text-[13px] font-medium transition-colors duration-200 ${
                isCompleted ? 'text-success' : isCurrent ? 'text-primary border-b-2 border-primary pb-1' : 'text-tertiary'
              }`}>
                  {isCompleted && '\u2713 '}{label}
                </span>
              );
            })}
          </div>
          {/* Mobile Step Indicator */}
          <div className="md:hidden mb-6">
            <p className="text-[13px] font-medium text-primary">Step {step} of 3 — {STEP_LABELS[step - 1]}</p>
            <div className="w-full h-[3px] rounded-full mt-2 bg-border">
              <div className="h-full rounded-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Step 1 — Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">Event Name</label>
                <input type="text" value={eventName} onChange={e => { setEventName(e.target.value); setStep1Errors(p => ({ ...p, name: '' })); }} className={inputClass('name')} placeholder="My Awesome Event" />
                {step1Errors.name && <p className="text-error text-xs mt-1">{step1Errors.name}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">Event Date</label>
                <input type="date" value={eventDate} onChange={e => { setEventDate(e.target.value); setStep1Errors(p => ({ ...p, date: '' })); }} className={inputClass('date')} />
                {step1Errors.date && <p className="text-error text-xs mt-1">{step1Errors.date}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">Event Time</label>
                <input type="time" value={eventTime} onChange={e => { setEventTime(e.target.value); setStep1Errors(p => ({ ...p, time: '' })); }} className={inputClass('time')} />
                {step1Errors.time && <p className="text-error text-xs mt-1">{step1Errors.time}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">Venue / Location</label>
                <input type="text" value={venue} onChange={e => { setVenue(e.target.value); setStep1Errors(p => ({ ...p, venue: '' })); }} className={inputClass('venue')} placeholder="The Hive, Victoria Island" />
                {step1Errors.venue && <p className="text-error text-xs mt-1">{step1Errors.venue}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">Organiser Name</label>
                <input type="text" value={organiserName} onChange={e => { setOrganiserName(e.target.value); setStep1Errors(p => ({ ...p, organiser: '' })); }} className={inputClass('organiser')} placeholder="TechHub Lagos" />
                {step1Errors.organiser && <p className="text-error text-xs mt-1">{step1Errors.organiser}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-1.5">
                  Event Description <span className="text-tertiary font-normal">(optional)</span>
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 text-[15px] rounded-lg border-[1.5px] border-border focus:border-primary outline-none transition-colors duration-150 resize-none" placeholder="Describe your event" />
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => { if (validateStep1()) setStep(2); }} className={secondaryBtn}>
                  Next — Branding &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Branding */}
          {step === 2 && (
            <div>
              <div>
                <label className="block text-[13px] font-medium text-primary mb-2">Brand Color</label>
                <div className="grid grid-cols-4 gap-1">
                  {CURATED_COLORS.map(c => (
                    <button key={c}
                      onClick={() => { setBrandColor(c); setPreviewColor(c); }}
                      onMouseEnter={() => setPreviewColor(c)}
                      onMouseLeave={() => setPreviewColor(brandColor)}
                      className={`w-9 h-9 rounded-lg transition-all duration-150 ${brandColor === c ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: previewColor }} />
                  <input type="text" value={customColor}
                    onChange={e => { setCustomColor(e.target.value); if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) { setBrandColor(e.target.value); setPreviewColor(e.target.value); } }}
                    placeholder="#000000" className="w-28 h-9 px-3 text-sm rounded-lg border-[1.5px] border-border focus:border-primary outline-none" />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-[13px] font-medium text-primary mb-2">Pass Template</label>
                <div className="space-y-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={`w-full text-left bg-white border rounded-xl p-4 flex items-center gap-4 transition-all duration-150 cursor-pointer ${
                        template === t.id ? 'border-[1.5px] border-primary bg-row-hover' : 'border-border hover:border-primary'
                      }`}>
                      <div className="w-20 h-12 rounded border border-border overflow-hidden flex-shrink-0">
                        <TemplateThumb index={t.id - 1} color={previewColor} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-primary">{t.name}</p>
                        <p className="text-[13px] text-secondary">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-[13px] font-medium text-primary mb-2">
                  Event Banner <span className="text-tertiary font-normal text-xs">(optional)</span>
                </label>
                <div onClick={() => bannerInputRef.current?.click()}
                  className="border-[1.5px] border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors duration-150">
                  {bannerUrl ? (
                    <div className="relative"><img src={bannerUrl} alt="Banner" className="max-h-24 mx-auto rounded" />
                      <button onClick={e => { e.stopPropagation(); setBannerFile(null); setBannerUrl(''); }} className="absolute top-1 right-1 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">&times;</button>
                    </div>
                  ) : (<><p className="text-sm text-tertiary">Upload image or drag here</p><p className="text-xs text-tertiary mt-1">PNG, JPG up to 5MB</p></>)}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]); }} />
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={() => setStep(1)} className={ghostBtn}>&larr; Back</button>
                <button onClick={() => setStep(3)} className={secondaryBtn}>Next — Attendees &rarr;</button>
              </div>
            </div>
          )}

          {/* Step 3 — Attendees */}
          {step === 3 && (
            <div>
              <div className="flex gap-6 border-b border-border">
                <button onClick={() => setActiveTab('manual')}
                  className={`text-sm font-medium pb-3 transition-colors ${activeTab === 'manual' ? 'text-primary border-b-2 border-primary' : 'text-tertiary'}`}>Add Manually</button>
                <button onClick={() => setActiveTab('csv')}
                  className={`text-sm font-medium pb-3 transition-colors ${activeTab === 'csv' ? 'text-primary border-b-2 border-primary' : 'text-tertiary'}`}>Upload CSV</button>
              </div>
              <div className="mt-6">
                {activeTab === 'manual' && (
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-medium text-primary mb-1.5">Attendee Name</label>
                        <input type="text" value={attendeeName}
                          onChange={e => { setAttendeeName(e.target.value); setStep3Errors(p => ({ ...p, name: '' })); }}
                          className={`w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] outline-none transition-colors ${step3Errors.name ? 'border-error' : 'border-border focus:border-primary'}`}
                          placeholder="Full name" />
                        {step3Errors.name && <p className="text-error text-xs mt-1">{step3Errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-primary mb-1.5">Email Address</label>
                        <input type="email" value={attendeeEmail}
                          onChange={e => { setAttendeeEmail(e.target.value); setStep3Errors(p => ({ ...p, email: '' })); }}
                          className={`w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] outline-none transition-colors ${step3Errors.email ? 'border-error' : 'border-border focus:border-primary'}`}
                          placeholder="email@example.com" />
                        {step3Errors.email && <p className="text-error text-xs mt-1">{step3Errors.email}</p>}
                        <p className="text-tertiary text-xs mt-1">Optional — used to email the pass directly</p>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-primary mb-1.5">Ticket Type</label>
                        <select value={ticketType} onChange={e => setTicketType(e.target.value)}
                          className="w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] border-border focus:border-primary outline-none bg-white">
                          <option>General</option><option>VIP</option><option>Speaker</option><option>Custom</option>
                        </select>
                      </div>
                      <button onClick={addAttendee} className={secondaryBtn + ' w-full'}>Add Attendee</button>
                    </div>
                    {attendees.length > 0 && <AttendeeList attendees={attendees} onRemove={removeAttendee} />}
                  </div>
                )}
                {activeTab === 'csv' && (
                  <div>
                    <div className="mb-3">
                      <p className="text-[13px] font-medium text-primary">Step 1 — Download the template</p>
                      <p className="text-[13px] text-secondary mt-1">Fill in your attendees in the CSV file</p>
                    </div>
                    <button onClick={downloadCsvTemplate} className={secondaryBtn}>Download CSV Template</button>
                    <div className="mt-6">
                      <p className="text-[13px] font-medium text-primary">Step 2 — Upload your filled file</p>
                      <div onClick={() => csvInputRef.current?.click()}
                        className={`mt-3 border-[1.5px] border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors duration-150 ${
                          csvState === 'success' ? 'border-success bg-success-bg' : csvState === 'error' ? 'border-error bg-error-bg' : 'border-border'
                        }`}>
                        {csvState === 'loading' && <p className="text-secondary text-sm">Reading your file...</p>}
                        {csvState === 'success' && <p className="text-success text-sm font-medium">{csvCount} attendees imported successfully</p>}
                        {csvState === 'error' && <p className="text-error text-sm">We couldn't read this file. Please use the CSV template provided.</p>}
                        {csvState === 'idle' && (<><p className="text-sm text-tertiary">Upload CSV file or drag here</p><p className="text-xs text-tertiary mt-1">.csv files only</p></>)}
                      </div>
                      <input ref={csvInputRef} type="file" accept=".csv" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]); }} />
                    </div>
                    {attendees.length > 0 && <AttendeeList attendees={attendees} onRemove={removeAttendee} />}
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={() => setStep(2)} className={ghostBtn}>&larr; Back</button>
                <div className="relative group">
                  <button onClick={handleSave} disabled={attendees.length === 0}
                    className={`text-sm font-medium px-6 py-2.5 rounded-lg transition-colors duration-150 ${
                      attendees.length > 0 ? 'bg-amber text-primary hover:bg-amber-dark cursor-pointer' : 'bg-amber text-primary opacity-40 cursor-not-allowed'
                    }`}>
                    {isEditing ? 'Save Changes' : 'Generate Passes'} &rarr;
                  </button>
                  {attendees.length === 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Add at least one attendee to continue
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Live Preview */}
        <div className="flex-1 bg-page flex items-center justify-center p-6 md:p-10 md:sticky md:top-0 md:h-screen">
          <div>
            <div className="transition-transform duration-400" style={{
              perspective: '1000px',
              transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
              transition: 'transform 200ms ease-out',
            }}>
              <PassCard event={previewEvent} attendee={currentPreviewAttendee} scale={1} />
            </div>
            <p className="text-center text-xs text-tertiary mt-4">Live Preview</p>
            {/* Dot indicators */}
            {attendees.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {attendees.length <= 5 ? (
                  attendees.map((_, i) => (
                    <button key={i} onClick={() => setPreviewIndex(i)}
                      className={`rounded-full transition-all duration-150 ${
                        i === previewIndex ? 'w-2.5 h-2.5 bg-primary' : 'w-1.5 h-1.5 bg-border'
                      }`} />
                  ))
                ) : (
                  <p className="text-xs text-tertiary">{Math.min(previewIndex + 1, attendees.length)} of {attendees.length}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Preview Button */}
      <button
        onClick={() => setMobilePreviewOpen(true)}
        className="md:hidden fixed z-50 bg-primary text-white text-[13px] font-medium px-7 py-3 rounded-full border-none"
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)' }}
      >
        Preview Pass
      </button>

      {/* Mobile Bottom Sheet */}
      {mobilePreviewOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-[90]" onClick={() => setMobilePreviewOpen(false)} style={{ transition: 'opacity 200ms' }} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] rounded-t-2xl px-6 pb-6 overflow-hidden animate-slide-up"
            style={{ height: '65vh' }}>
            {/* Drag handle */}
            <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-5 bg-border" />
            {/* Title row */}
            <div className="flex items-center justify-between mb-5">
              <p className="font-medium text-[15px] text-primary">Live Preview</p>
              <button onClick={() => setMobilePreviewOpen(false)} className="p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Pass preview */}
            <div className="flex justify-center">
              <div style={{ maxWidth: '100%' }}>
                <PassCard event={previewEvent} attendee={currentPreviewAttendee} scale={1} />
                {attendees.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {attendees.length <= 5 ? (
                      attendees.map((_, i) => (
                        <button key={i} onClick={() => setPreviewIndex(i)}
                          className={`rounded-full transition-all duration-150 ${i === previewIndex ? 'w-2.5 h-2.5 bg-primary' : 'w-1.5 h-1.5 bg-border'}`} />
                      ))
                    ) : (
                      <p className="text-xs text-tertiary">{Math.min(previewIndex + 1, attendees.length)} of {attendees.length}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
}

function AttendeeList({ attendees, onRemove }: { attendees: Attendee[]; onRemove: (id: string) => void }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[13px] font-medium text-primary">Added Attendees</p>
        <span className="px-2 py-0.5 bg-page text-secondary text-xs font-medium rounded-full">{attendees.length}</span>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {attendees.map(a => (
          <div key={a.id} className="bg-white border border-border rounded-lg px-4 py-3 flex items-center justify-between animate-slide-in-top">
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-medium text-sm text-primary truncate">{a.name}</p>
              <TicketBadge type={a.ticket_type} />
            </div>
            <button onClick={() => onRemove(a.id)} className="text-tertiary hover:text-error transition-colors duration-150 flex-shrink-0">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketBadge({ type }: { type: string }) {
  if (type === 'VIP') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-amber text-primary">VIP</span>;
  if (type === 'Speaker') return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-primary text-white">Speaker</span>;
  return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-page text-secondary">{type}</span>;
}

function TemplateThumb({ index, color }: { index: number; color: string }) {
  if (index === 0) return (
    <div className="w-full h-full flex"><div className="flex-1"><div style={{ backgroundColor: color, height: '30%' }} /><div className="p-1 space-y-0.5"><div className="bg-page h-0.5 w-8" /><div className="bg-page h-0.5 w-6" /></div></div><div className="w-8 flex items-center justify-center border-l border-dashed border-border"><div className="bg-page w-3 h-3" /></div></div>
  );
  if (index === 1) return (
    <div className="w-full h-full"><div style={{ backgroundColor: color, height: '15%' }} /><div className="p-1 space-y-0.5"><div className="bg-page h-0.5 w-10" /><div className="bg-page h-0.5 w-6" /></div><div className="flex justify-center mt-0.5"><div className="bg-page w-3 h-3" /></div></div>
  );
  return (
    <div className="w-full h-full"><div className="px-1 pt-1" style={{ backgroundColor: color, height: '55%' }}><div className="bg-white/30 h-0.5 w-8" /></div><div className="px-1 py-0.5 flex items-center justify-between"><div className="bg-page h-0.5 w-6" /><div className="bg-page w-3 h-3" /></div></div>
  );
}
