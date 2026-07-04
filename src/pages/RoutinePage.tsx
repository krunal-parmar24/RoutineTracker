import { useEffect, useMemo, useState } from 'react';
import RoutineEntryForm from '../components/routine/RoutineEntryForm';
import Modal from '../components/ui/Modal';
import { useAuthContext } from '../context/AuthContext';
import { validateRoutineEntries } from '../services/routineService';
import { appServices } from '../services/appServices';
import type { DayOfWeek, RoutineEntry, WeeklyRoutine } from '../types/routine';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const repository = appServices.routineRepository;

function RoutinePage() {
  const { user } = useAuthContext();
  const [routine, setRoutine] = useState<WeeklyRoutine | null>(null);
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [isEditing, setIsEditing] = useState(false);
  const [draftEntry, setDraftEntry] = useState<RoutineEntry | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    repository.getRoutine(user.id).then((loadedRoutine) => {
      setRoutine(loadedRoutine);
    });
  }, [user?.id]);

  const entriesByDay = useMemo(() => {
    return DAYS.reduce<Record<DayOfWeek, RoutineEntry[]>>((accumulator, day) => {
      accumulator[day] = (routine?.entries ?? []).filter((entry) => entry.dayOfWeek === day).sort((a, b) => a.order - b.order);
      return accumulator;
    }, {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    });
  }, [routine]);

  const saveEntry = async (entry: Omit<RoutineEntry, 'id' | 'createdAt' | 'order'>) => {
    if (!user?.id) {
      return;
    }

    const nextEntries = [...(routine?.entries ?? [])];
    const currentDayEntries = nextEntries.filter((item) => item.dayOfWeek === entry.dayOfWeek);
    const validation = validateRoutineEntries([
      ...currentDayEntries.map((item) => ({ title: item.title, startTime: item.startTime, endTime: item.endTime })),
      { title: entry.title, startTime: entry.startTime, endTime: entry.endTime },
    ]);

    if (!validation.isValid) {
      window.alert(validation.message ?? 'Invalid routine entry.');
      return;
    }

    const nextEntry: RoutineEntry = {
      id: draftEntry?.id ?? crypto.randomUUID(),
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      title: entry.title,
      description: entry.description,
      order: draftEntry?.order ?? currentDayEntries.length,
      createdAt: draftEntry?.createdAt ?? new Date().toISOString(),
    };

    const updatedEntries = draftEntry
      ? nextEntries.map((item) => (item.id === draftEntry.id ? nextEntry : item))
      : [...nextEntries, nextEntry];

    const nextRoutine: WeeklyRoutine = {
      id: routine?.id ?? crypto.randomUUID(),
      userId: user.id,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    const savedRoutine = await repository.saveRoutine(nextRoutine);
    setRoutine(savedRoutine);
    setIsEditing(false);
    setDraftEntry(null);
  };

  const deleteEntry = async (entryId: string) => {
    if (!routine || !user?.id) {
      return;
    }

    const updatedEntries = routine.entries.filter((entry) => entry.id !== entryId);
    const nextRoutine: WeeklyRoutine = {
      ...routine,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    const savedRoutine = await repository.saveRoutine(nextRoutine);
    setRoutine(savedRoutine);
  };

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="section-header">
          <div>
            <p className="meta-label">Weekly planning</p>
            <h2 className="section-title">Your routine schedule</h2>
            <p className="section-text">Add reusable entries and manage your weekly rhythm with a clean, calm interface.</p>
          </div>
          <button onClick={() => { setDraftEntry(null); setIsEditing(true); }} className="button button-primary">Add entry</button>
        </div>

        <div className="pill-tabs">
          {DAYS.map((day) => (
            <button key={day} onClick={() => setActiveDay(day)} className={activeDay === day ? 'pill active' : 'pill'}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 className="section-title" style={{ marginBottom: '10px', textTransform: 'capitalize' }}>{activeDay}</h3>
          {entriesByDay[activeDay].length === 0 ? (
            <p className="section-text">No entries yet for this day.</p>
          ) : (
            <div className="card-list">
              {entriesByDay[activeDay].map((entry) => (
                <div key={entry.id} className="entry-card card-compact">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{entry.startTime} – {entry.endTime}</p>
                        <p style={{ margin: 0 }}>{entry.title}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => { setDraftEntry(entry); setIsEditing(true); }} className="button button-secondary">Edit</button>
                        <button onClick={() => deleteEntry(entry.id)} className="button button-ghost" style={{ color: 'var(--danger)', borderColor: '#fee2e2' }}>Delete</button>
                      </div>
                    </div>
                    {entry.description ? <p className="small-text" style={{ margin: 0 }}>{entry.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal title={draftEntry ? 'Edit entry' : 'Add entry'} isOpen={isEditing} onClose={() => { setIsEditing(false); setDraftEntry(null); }}>
        <RoutineEntryForm
          dayOfWeek={activeDay}
          initialEntry={draftEntry ?? undefined}
          onSubmit={saveEntry}
          onCancel={() => { setIsEditing(false); setDraftEntry(null); }}
        />
      </Modal>
    </div>
  );
}

export default RoutinePage;
