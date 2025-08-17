import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

// Mock the useTranslation hook from react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

describe('LanguageSwitcher', () => {
  it('renders the language switcher buttons', () => {
    render(<LanguageSwitcher />);

    // Check if the English button is rendered
    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toBeInTheDocument();

    // Check if the Arabic button is rendered
    const arabicButton = screen.getByRole('button', { name: /العربية/i });
    expect(arabicButton).toBeInTheDocument();
  });
});
