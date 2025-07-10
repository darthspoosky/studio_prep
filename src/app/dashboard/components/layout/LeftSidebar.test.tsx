import { render, screen } from '@testing-library/react';
import LeftSidebar from './LeftSidebar';

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return {
    BarChart3: Icon,
    Newspaper: Icon,
    Mic: Icon,
    FileQuestion: Icon,
    PenLine: Icon,
    Book: Icon,
    Users: Icon,
    HelpCircle: Icon,
    LogOut: Icon,
    LayoutDashboard: Icon,
    FileText: Icon,
    UserRound: Icon,
    CalendarDays: Icon,
    BookOpen: Icon,
    GraduationCap: Icon,
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

describe('LeftSidebar', () => {
  it('renders navigation links', () => {
    render(<LeftSidebar usageStats={null} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Newspaper Analysis')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
    expect(screen.getByText('Question Bank')).toBeInTheDocument();
  });
});
