/**
 * Smart Input Normalizer & Helper Utilities
 * Solves typing issues, Arabic/Indic numerals rejection in number inputs,
 * iframe focus drops, and provides programmatic text injection for React forms.
 */

// Mapping of Eastern Arabic (and Persian) digits to standard ASCII digits
const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٫': '.', '،': '.',
};

/**
 * Converts all Arabic/Indic numerals and Arabic decimal commas to standard digits and dots.
 */
export function normalizeArabicNumbers(input: string): string {
  if (!input) return '';
  return input.replace(/[٠-٩۰-۹٫،]/g, (char) => ARABIC_INDIC_DIGITS[char] || char);
}

/**
 * Safely updates an input or textarea value in a way that React's internal state tracker
 * and onChange listeners are properly notified.
 */
export function setNativeInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const isTextArea = element instanceof HTMLTextAreaElement;
  const prototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch events so React picks up the change
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

/**
 * Inserts text at the current cursor/selection position of an input or textarea,
 * updating React state seamlessly.
 */
export function insertTextAtCursor(element: HTMLInputElement | HTMLTextAreaElement, textToInsert: string): void {
  element.focus();
  const currentVal = element.value || '';
  let start = currentVal.length;
  let end = currentVal.length;

  try {
    if (element.selectionStart !== null && element.selectionStart !== undefined) {
      start = element.selectionStart;
    }
    if (element.selectionEnd !== null && element.selectionEnd !== undefined) {
      end = element.selectionEnd;
    }
  } catch {
    // HTML5 input types like 'number', 'email', 'date' throw DOMException when accessing selectionStart/selectionEnd
    start = currentVal.length;
    end = currentVal.length;
  }

  const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
  setNativeInputValue(element, newVal);

  const nextPos = start + textToInsert.length;
  try {
    element.setSelectionRange(nextPos, nextPos);
  } catch {
    // Some input types like number might not support setSelectionRange
  }
}

/**
 * Deletes one character before cursor (backspace), updating React state.
 */
export function backspaceAtCursor(element: HTMLInputElement | HTMLTextAreaElement): void {
  element.focus();
  const currentVal = element.value || '';
  let start = currentVal.length;
  let end = currentVal.length;

  try {
    if (element.selectionStart !== null && element.selectionStart !== undefined) {
      start = element.selectionStart;
    }
    if (element.selectionEnd !== null && element.selectionEnd !== undefined) {
      end = element.selectionEnd;
    }
  } catch {
    // HTML5 input types like 'number', 'email', 'date' throw DOMException
    start = currentVal.length;
    end = currentVal.length;
  }

  let newVal = currentVal;
  let nextPos = start;

  if (start !== end) {
    newVal = currentVal.substring(0, start) + currentVal.substring(end);
    nextPos = start;
  } else if (start > 0) {
    newVal = currentVal.substring(0, start - 1) + currentVal.substring(start);
    nextPos = start - 1;
  }

  setNativeInputValue(element, newVal);
  try {
    element.setSelectionRange(nextPos, nextPos);
  } catch {
    // Ignore for input types that do not support selection range
  }
}

/**
 * Global Keyboard & Input Sanitizer.
 * Intercepts typing across all inputs to ensure:
 * 1. Arabic numerals (٠-٩) typed on Arabic keyboards are automatically converted to standard (0-9)
 *    especially in <input type="number">, avoiding browser silent rejections.
 * 2. Arabic decimal separators (٫ or ،) are converted to standard dot (.) for number inputs.
 * 3. Iframe focus is kept active and keystrokes are never swallowed by parent elements.
 */
let isInitialized = false;

export function setupGlobalInputSanitizer(): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }
  isInitialized = true;

  // Intercept beforeinput to convert Arabic numerals before the browser discards them
  const handleBeforeInput = (e: InputEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInput = target instanceof HTMLInputElement;
    const isTextArea = target instanceof HTMLTextAreaElement;
    if (!isInput && !isTextArea) return;

    const data = e.data;
    if (!data) return;

    // Check if the typed data contains Arabic numerals or Arabic commas
    const hasArabicDigits = /[٠-٩۰-۹٫،]/.test(data);
    if (!hasArabicDigits) return;

    const isNumberType = isInput && (target.type === 'number' || target.inputMode === 'numeric' || target.inputMode === 'decimal');
    const converted = normalizeArabicNumbers(data);

    // If it's a number field or general input, prevent default rejection and insert converted
    if (isNumberType || hasArabicDigits) {
      e.preventDefault();
      insertTextAtCursor(target, converted);
    }
  };

  // Fallback for keydown on number inputs when beforeinput might not fire
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInput = target instanceof HTMLInputElement;
    const isTextArea = target instanceof HTMLTextAreaElement;
    if (!isInput && !isTextArea) return;

    const key = e.key;

    // Convert Arabic numerals if typed
    if (ARABIC_INDIC_DIGITS[key]) {
      const isNumberType = isInput && (target.type === 'number' || target.inputMode === 'numeric' || target.inputMode === 'decimal');
      if (isNumberType) {
        e.preventDefault();
        insertTextAtCursor(target, ARABIC_INDIC_DIGITS[key]);
      }
    }
  };

  // Intercept paste to clean Arabic numerals
  const handlePaste = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInput = target instanceof HTMLInputElement;
    const isTextArea = target instanceof HTMLTextAreaElement;
    if (!isInput && !isTextArea) return;

    const text = e.clipboardData?.getData('text');
    if (!text) return;

    const isNumberType = isInput && (target.type === 'number' || target.inputMode === 'numeric' || target.inputMode === 'decimal');

    if (/[٠-٩۰-۹٫،]/.test(text)) {
      e.preventDefault();
      const cleaned = normalizeArabicNumbers(text);
      insertTextAtCursor(target, isNumberType ? cleaned.replace(/[^0-9.-]/g, '') : cleaned);
    }
  };

  // Ensure iframe window click regains focus
  const handleWindowClick = () => {
    if (document.activeElement === document.body) {
      window.focus();
    }
  };

  window.addEventListener('beforeinput', handleBeforeInput as EventListener, { capture: true });
  window.addEventListener('keydown', handleKeyDown, { capture: true });
  window.addEventListener('paste', handlePaste, { capture: true });
  window.addEventListener('click', handleWindowClick, { passive: true });

  return () => {
    isInitialized = false;
    window.removeEventListener('beforeinput', handleBeforeInput as EventListener, { capture: true });
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
    window.removeEventListener('paste', handlePaste, { capture: true });
    window.removeEventListener('click', handleWindowClick);
  };
}
