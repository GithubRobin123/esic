// Opens the native picker automatically when a date/time input is reached via Tab, so keyboard
// users see the calendar/clock widget without a second click. Mouse-driven focus is left alone —
// clicking already opens the picker natively, and re-triggering it here would just toggle it shut.
const PICKER_INPUT_TYPES = new Set(['date', 'datetime-local', 'month', 'time', 'week']);

let lastPointerDownAt = 0;
const POINTER_FOCUS_WINDOW_MS = 300;

const handlePointerDown = () => {
  lastPointerDownAt = Date.now();
};

const handleFocusIn = (e: FocusEvent) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!PICKER_INPUT_TYPES.has(target.type) || target.disabled || target.readOnly) return;
  // Skip focus that immediately followed a mouse/touch press on this input — that's a click, not a Tab.
  if (Date.now() - lastPointerDownAt < POINTER_FOCUS_WINDOW_MS) return;
  try {
    target.showPicker();
  } catch {
    // showPicker() throws if unsupported or not triggered by user activation — safe to ignore
  }
};

export const initAutoOpenDatePicker = () => {
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('focusin', handleFocusIn);
  return () => {
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('focusin', handleFocusIn);
  };
};
