/**
 * Accessibility utility functions and constants for WCAG 2.1 AA compliance
 */

// ARIA role constants
export const ARIA_ROLES = {
  BUTTON: 'button',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  NAVIGATION: 'navigation',
  BANNER: 'banner',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  REGION: 'region',
  ALERT: 'alert',
  STATUS: 'status',
  DIALOG: 'dialog',
  ALERTDIALOG: 'alertdialog',
  MENUBAR: 'menubar',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  TEXTBOX: 'textbox',
  SEARCHBOX: 'searchbox',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  PROGRESSBAR: 'progressbar',
  TOOLTIP: 'tooltip',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  TREE: 'tree',
  TREEITEM: 'treeitem',
  GROUP: 'group',
  RADIOGROUP: 'radiogroup',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  SWITCH: 'switch'
} as const;

// Common ARIA attributes
export const ARIA_ATTRIBUTES = {
  // States
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  PRESSED: 'aria-pressed',
  CURRENT: 'aria-current',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  INVALID: 'aria-invalid',
  REQUIRED: 'aria-required',
  READONLY: 'aria-readonly',
  
  // Properties
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  
  // Values
  VALUEMIN: 'aria-valuemin',
  VALUEMAX: 'aria-valuemax',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
  
  // Relationships
  LEVEL: 'aria-level',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  
  // Live regions
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
} as const;

// Keyboard navigation constants
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const;

/**
 * Generates a unique ID for accessibility purposes
 */
export function generateAccessibilityId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates ARIA attributes for form controls with validation
 */
export function createFormControlAria(options: {
  id: string;
  label?: string;
  description?: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
}) {
  const { id, label, description, required, invalid, errorMessage } = options;
  
  const aria: Record<string, string | boolean> = {};
  
  if (label) {
    aria[ARIA_ATTRIBUTES.LABEL] = label;
  }
  
  if (description) {
    aria[ARIA_ATTRIBUTES.DESCRIBEDBY] = `${id}-description`;
  }
  
  if (required) {
    aria[ARIA_ATTRIBUTES.REQUIRED] = true;
  }
  
  if (invalid) {
    aria[ARIA_ATTRIBUTES.INVALID] = true;
    if (errorMessage) {
      aria[ARIA_ATTRIBUTES.DESCRIBEDBY] = `${id}-error`;
    }
  }
  
  return aria;
}

/**
 * Creates ARIA attributes for interactive elements
 */
export function createInteractiveAria(options: {
  role?: string;
  pressed?: boolean;
  expanded?: boolean;
  selected?: boolean;
  current?: boolean | string;
  controls?: string;
  label?: string;
  labelledby?: string;
  describedby?: string;
}) {
  const aria: Record<string, string | boolean> = {};
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      switch (key) {
        case 'role':
          // Role is not an ARIA attribute, handled separately
          break;
        case 'pressed':
          aria[ARIA_ATTRIBUTES.PRESSED] = value;
          break;
        case 'expanded':
          aria[ARIA_ATTRIBUTES.EXPANDED] = value;
          break;
        case 'selected':
          aria[ARIA_ATTRIBUTES.SELECTED] = value;
          break;
        case 'current':
          aria[ARIA_ATTRIBUTES.CURRENT] = value;
          break;
        case 'controls':
          aria[ARIA_ATTRIBUTES.CONTROLS] = value;
          break;
        case 'label':
          aria[ARIA_ATTRIBUTES.LABEL] = value;
          break;
        case 'labelledby':
          aria[ARIA_ATTRIBUTES.LABELLEDBY] = value;
          break;
        case 'describedby':
          aria[ARIA_ATTRIBUTES.DESCRIBEDBY] = value;
          break;
      }
    }
  });
  
  return aria;
}

/**
 * Creates proper keyboard event handlers for interactive elements
 */
export function createKeyboardHandler(
  onActivate: () => void,
  keys: string[] = [KEYS.ENTER, KEYS.SPACE]
) {
  return (event: React.KeyboardEvent) => {
    if (keys.includes(event.key)) {
      event.preventDefault();
      onActivate();
    }
  };
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Sets focus to an element by ID
   */
  focusElement(id: string): boolean {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  },

  /**
   * Gets all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(selector));
  },

  /**
   * Traps focus within a container (useful for modals)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYS.TAB) {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
};

/**
 * Color contrast utilities for WCAG compliance
 */
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getLuminance(...color1);
    const l2 = this.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG guidelines
   */
  meetsWCAG(ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    }
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create visually hidden text for screen readers
   */
  createVisuallyHidden(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }
};

/**
 * Common accessibility patterns
 */
export const accessibilityPatterns = {
  /**
   * Tab navigation pattern
   */
  createTabNavigation(tabs: HTMLElement[], panels: HTMLElement[]) {
    let currentIndex = 0;

    const activateTab = (index: number) => {
      // Deactivate all tabs
      tabs.forEach((tab, i) => {
        tab.setAttribute(ARIA_ATTRIBUTES.SELECTED, 'false');
        tab.setAttribute('tabindex', '-1');
        panels[i]?.setAttribute(ARIA_ATTRIBUTES.HIDDEN, 'true');
      });

      // Activate current tab
      tabs[index].setAttribute(ARIA_ATTRIBUTES.SELECTED, 'true');
      tabs[index].setAttribute('tabindex', '0');
      panels[index]?.setAttribute(ARIA_ATTRIBUTES.HIDDEN, 'false');
      tabs[index].focus();
      
      currentIndex = index;
    };

    const handleKeyDown = (e: KeyboardEvent, index: number) => {
      switch (e.key) {
        case KEYS.ARROW_LEFT:
          e.preventDefault();
          activateTab(index > 0 ? index - 1 : tabs.length - 1);
          break;
        case KEYS.ARROW_RIGHT:
          e.preventDefault();
          activateTab(index < tabs.length - 1 ? index + 1 : 0);
          break;
        case KEYS.HOME:
          e.preventDefault();
          activateTab(0);
          break;
        case KEYS.END:
          e.preventDefault();
          activateTab(tabs.length - 1);
          break;
      }
    };

    // Set up event listeners
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(index));
      tab.addEventListener('keydown', (e) => handleKeyDown(e, index));
    });

    // Initialize first tab
    activateTab(0);
  }
};

export default {
  ARIA_ROLES,
  ARIA_ATTRIBUTES,
  KEYS,
  generateAccessibilityId,
  createFormControlAria,
  createInteractiveAria,
  createKeyboardHandler,
  focusManagement,
  colorContrast,
  screenReader,
  accessibilityPatterns
};