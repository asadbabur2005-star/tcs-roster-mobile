// Accessibility utilities for TCS Roster Mobile

let idCounter = 0;

export const generateId = (prefix = 'element') => {
  return `${prefix}-${++idCounter}`;
};

export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const getShiftAriaLabel = (dayLabel, shift, carerCount) => {
  const shiftTime = shift === 'morning' ? '10:00 AM to 2:00 PM' : '6:00 PM to 10:00 PM';
  return `${dayLabel} ${shiftTime} shift with ${carerCount} carer${carerCount === 1 ? '' : 's'}`;
};

export const getCarerInputAriaLabel = (dayLabel, shift, index) => {
  const shiftTime = shift === 'morning' ? '10:00 AM to 2:00 PM' : '6:00 PM to 10:00 PM';
  return `Carer ${index + 1} name for ${dayLabel} ${shiftTime} shift`;
};

export const getInstructionsAriaLabel = (dayLabel) => {
  return `Instructions for ${dayLabel}`;
};

export const handleEnterAsClick = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

export const focusElement = (selector, delay = 100) => {
  setTimeout(() => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
    }
  }, delay);
};

export const scrollToElement = (selector, behavior = 'smooth') => {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior, block: 'center' });
  }
};