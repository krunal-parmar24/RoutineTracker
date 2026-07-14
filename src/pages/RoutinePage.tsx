import { useEffect, useMemo, useState } from 'react';
import RoutineEntryForm from '../components/routine/RoutineEntryForm';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import { useAuthContext } from '../context/AuthContext';
import { buildComparableEntries, validateRoutineEntries } from '../services/routineService';
import { buildRoutineTimeLabel } from '../services/todoService';
import { appServices } from '../services/appServices';
import type { DayOfWeek, RoutineEntry, WeeklyRoutine } from '../types/routine';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const repository = appServices.routineRepository;

function RoutinePage() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [routine, setRoutine] = useState<WeeklyRoutine | null>(null);
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [isEditing, setIsEditing] = useState(false);
  const [draftEntry, setDraftEntry] = useState<RoutineEntry | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    (async () => {
      try {
        const loadedRoutine = await repository.getRoutine(user.id);
        setRoutine(loadedRoutine);
      } catch (err) {
        console.error('Failed loading routine', err);
        showToast(err instanceof Error ? err.message : 'Failed to load routine.');
      }
    })();
  }, [user?.id, showToast]);

  const entriesByDay = useMemo(() => {
    return DAYS.reduce<Record<DayOfWeek, RoutineEntry[]>>((accumulator, day) => {
      accumulator[day] = (routine?.entries ?? [])
        .filter((entry) => entry.dayOfWeek === day && !entry.deletedAt)
        .sort((a, b) => a.order - b.order);
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
    const currentDayEntries = nextEntries.filter((item) => item.dayOfWeek === entry.dayOfWeek && !item.deletedAt);
    const validation = validateRoutineEntries(
      buildComparableEntries(
        currentDayEntries,
        { title: entry.title, startTime: entry.startTime, endTime: entry.endTime },
        draftEntry?.id,
      ),
    );

    if (!validation.isValid) {
      showToast(validation.message ?? 'Invalid routine entry.');
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

    try {
      const savedRoutine = await repository.saveRoutine(nextRoutine);
      setRoutine(savedRoutine);
      setIsEditing(false);
      setDraftEntry(null);
      showToast(draftEntry ? 'Routine entry updated.' : 'Routine entry added.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save routine entry.');
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!routine || !user?.id) {
      return;
    }

    const confirmed = window.confirm('Delete this routine entry? Existing todos for it will still be trackable.');
    if (!confirmed) {
      return;
    }

    // Soft delete: keep the entry (and its history) so previously assigned todos remain trackable.
    const updatedEntries = routine.entries.map((entry) =>
      entry.id === entryId ? { ...entry, deletedAt: new Date().toISOString() } : entry,
    );
    const nextRoutine: WeeklyRoutine = {
      ...routine,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    try {
      const savedRoutine = await repository.saveRoutine(nextRoutine);
      setRoutine(savedRoutine);
      showToast('Routine entry deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete routine entry.');
    }
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
                  <div className="entry-card-body">
                    <div className="entry-card-info">
                      <p className="entry-card-time">{buildRoutineTimeLabel(entry)}</p>
                      <p className="entry-card-title">{entry.title}</p>
                      {entry.description ? <p className="small-text" style={{ margin: 0 }}>{entry.description}</p> : null}
                    </div>
                    <div className="entry-actions">
                      <button onClick={() => { setDraftEntry(entry); setIsEditing(true); }} className="button button-secondary">Edit</button>
                      <button onClick={() => deleteEntry(entry.id)} className="button button-danger">Delete</button>
                    </div>
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
