import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('should display the app title', async () => {
    render(<App title="React" />);

    expect(screen.getByRole('heading')).toHaveTextContent('TODOs');
  });

  it('should display an Add button', async () => {
    render(<App title="React" />);

    expect(screen.getByRole('button')).toBeVisible();
    expect(screen.getByRole('button')).toHaveTextContent('Add');
  });
});
