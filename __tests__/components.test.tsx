import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Button } from '@/components/ui/button';

describe('Components', () => {
  it('should render button component', () => {
    render(
      <ThemeProvider>
        <Button>Click me</Button>
      </ThemeProvider>
    );
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
















