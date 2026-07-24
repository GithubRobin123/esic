import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * Drop-in replacement for <input type="date">. Native date inputs render their
 * calendar/typed format using the OS locale (mm/dd/yyyy on some systems,
 * dd/mm/yyyy on others), so the same app looks different across machines.
 * This component always displays/accepts dd/mm/yyyy and stores the value as a
 * plain yyyy-mm-dd string, matching what the native input's value used to be.
 *
 * The calendar dropdown is rendered through a portal into document.body and
 * positioned from the input's live bounding rect (position: fixed), so it is
 * never clipped by an ancestor card/table with overflow:hidden or a lower
 * stacking context — this was previously cutting the dropdown off wherever a
 * date field lived inside a bounded card.
 */
interface DateInputProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  title?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DROPDOWN_WIDTH = 240;
const DROPDOWN_HEIGHT_ESTIMATE = 270;

const pad2 = (n: number) => String(n).padStart(2, '0');

const isoToDisplay = (iso?: string): string => {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

const displayToIso = (disp: string): string | null => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(disp.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const maskDigits = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += '/' + digits.slice(2, 4);
  if (digits.length > 4) out += '/' + digits.slice(4, 8);
  return out;
};

const navBtnStyle: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer', fontSize: 16,
  color: 'var(--text, #0f172a)', padding: '2px 8px', borderRadius: 4, lineHeight: 1,
};

interface Rect { top: number; left: number; bottom: number; width: number; }

const DateInput: React.FC<DateInputProps> = ({
  value, onChange, className, id, name, placeholder, required, disabled,
  min, max, title, style, autoFocus,
}) => {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(() => (value ? Number(value.slice(0, 4)) : now.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? Number(value.slice(5, 7)) - 1 : now.getMonth()));
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(isoToDisplay(value)); }, [value]);

  const updateRect = () => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, bottom: r.bottom, width: r.width });
    }
  };

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const onReposition = () => updateRect();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (iso: string) => onChange({ target: { value: iso } });

  const isOutOfRange = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  const openCalendar = () => {
    if (disabled) return;
    if (value) {
      setViewYear(Number(value.slice(0, 4)));
      setViewMonth(Number(value.slice(5, 7)) - 1);
    }
    updateRect();
    setOpen(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDigits(e.target.value);
    setText(masked);
    if (masked.length === 0) { commit(''); return; }
    if (masked.length === 10) {
      const iso = displayToIso(masked);
      if (iso) {
        commit(iso);
        setViewYear(Number(iso.slice(0, 4)));
        setViewMonth(Number(iso.slice(5, 7)) - 1);
      }
    }
  };

  const handleBlur = () => {
    if (text.length > 0 && (text.length < 10 || !displayToIso(text))) {
      setText(isoToDisplay(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (d: number) => {
    const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
    if (isOutOfRange(iso)) return;
    commit(iso);
    setText(isoToDisplay(iso));
    setOpen(false);
  };

  const cells: Array<{ day: number; iso: string } | null> = [];
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, iso: `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}` });

  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const dropdown = open && !disabled && rect && (() => {
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < DROPDOWN_HEIGHT_ESTIMATE && rect.top > DROPDOWN_HEIGHT_ESTIMATE;
    const left = Math.min(rect.left, window.innerWidth - DROPDOWN_WIDTH - 8);
    const dropdownStyle: React.CSSProperties = openUpward
      ? { position: 'fixed', left, bottom: window.innerHeight - rect.top + 4, width: DROPDOWN_WIDTH }
      : { position: 'fixed', left, top: rect.bottom + 4, width: DROPDOWN_WIDTH };

    return ReactDOM.createPortal(
      <div
        ref={dropdownRef}
        style={{
          ...dropdownStyle,
          background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 3000, padding: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); changeMonth(-1); }} style={navBtnStyle}>‹</button>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); changeMonth(1); }} style={navBtnStyle}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ fontSize: 10, textAlign: 'center', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>{w}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} />;
            const disabledDay = isOutOfRange(cell.iso);
            const isSelected = cell.iso === value;
            const isToday = cell.iso === todayIso;
            return (
              <button
                key={cell.iso}
                type="button"
                disabled={disabledDay}
                onMouseDown={(e) => { e.preventDefault(); if (!disabledDay) selectDay(cell.day); }}
                style={{
                  fontSize: 11, textAlign: 'center', padding: '5px 0', borderRadius: 6,
                  border: isToday && !isSelected ? '1px solid var(--primary, #0ea5e9)' : '1px solid transparent',
                  background: isSelected ? 'var(--primary, #0ea5e9)' : 'transparent',
                  color: isSelected ? '#fff' : disabledDay ? 'var(--text-muted, #64748b)' : 'var(--text, #0f172a)',
                  cursor: disabledDay ? 'not-allowed' : 'pointer',
                  opacity: disabledDay ? 0.4 : 1,
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (!isOutOfRange(todayIso)) { commit(todayIso); setText(isoToDisplay(todayIso)); setOpen(false); }
            }}
            style={{ fontSize: 11, color: 'var(--primary, #0ea5e9)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); commit(''); setText(''); setOpen(false); }}
              style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  })();

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        className={className}
        id={id}
        name={name}
        style={style}
        title={title}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder || 'dd/mm/yyyy'}
        value={text}
        onChange={handleTextChange}
        onFocus={openCalendar}
        onClick={openCalendar}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
      />
      {dropdown}
    </div>
  );
};

export default DateInput;
