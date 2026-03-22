import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContent';
import Doctors from './Doctors';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as doctorApi from '../api/doctorApi';

vi.mock('../api/doctorApi');

const mockDoctors = [
  {
    id: 1,
    name: 'Dr. John Smith',
    specialtyName: 'Cardiology',
    mode: 'ONLINE',
    consultationFee: 500,
  },
  {
    id: 2,
    name: 'Dr. Jane Doe',
    specialtyName: 'Neurology',
    mode: 'OFFLINE',
    consultationFee: 600,
  },
];

const mockSpecialties = [
  { id: 1, name: 'Cardiology' },
  { id: 2, name: 'Neurology' },
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Doctors Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders doctors list on load', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    });
  });

  test('displays doctor details correctly', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
      expect(screen.getByText(/ONLINE/)).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    vi.spyOn(doctorApi, 'getDoctors').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    expect(screen.queryByText(/loading/i)).toBeInTheDocument();
  });

  test('filters doctors by specialty', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue([mockDoctors[0]]);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const specialtySelect = screen.getByRole('combobox', { name: /specialty/i });
    await act(async () => {
      fireEvent.change(specialtySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      expect(doctorApi.getDoctors).toHaveBeenCalledWith(expect.objectContaining({ specialtyId: 1 }));
    });
  });

  test('filters doctors by mode', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue([mockDoctors[0]]);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const modeSelect = screen.getByRole('combobox', { name: /mode/i });
    await act(async () => {
      fireEvent.change(modeSelect, { target: { value: 'ONLINE' } });
    });

    await waitFor(() => {
      expect(doctorApi.getDoctors).toHaveBeenCalledWith(expect.objectContaining({ mode: 'ONLINE' }));
    });
  });

  test('displays error message on API failure', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockRejectedValue(new Error('Failed to fetch doctors'));
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.queryByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no doctors found', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue([]);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.queryByText(/no doctors|empty/i)).toBeInTheDocument();
    });
  });

  test('clicking doctor card navigates to doctor details', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const doctorCard = screen.getByText('Dr. John Smith').closest('a');
    expect(doctorCard).toHaveAttribute('href', '/doctors/1');
  });

  test('loads specialties on component mount', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(doctorApi.getSpecialties).toHaveBeenCalled();
    });
  });

  test('handles multiple filters simultaneously', async () => {
    const filtered = [mockDoctors[0]];
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(filtered);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const specialtySelect = screen.getByDisplayValue('Select Specialty');
    const modeSelect = screen.getByDisplayValue('Select Mode');

    fireEvent.change(specialtySelect, { target: { value: '1' } });
    fireEvent.change(modeSelect, { target: { value: 'ONLINE' } });

    await waitFor(() => {
      expect(doctorApi.getDoctors).toHaveBeenCalledWith(
        expect.objectContaining({
          specialtyId: 1,
          mode: 'ONLINE',
        })
      );
    });
  });

  test('resets filters', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const resetButton = screen.getByRole('button', { name: /reset|clear/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(doctorApi.getDoctors).toHaveBeenCalledWith({
        specialtyId: null,
        mode: null,
      });
    });
  });

  test('displays doctor count', async () => {
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(mockDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.queryByText(/2 doctors|found 2/i)).toBeInTheDocument();
    });
  });

  test('pagination works correctly', async () => {
    const manyDoctors = Array.from({ length: 15 }, (_, i) => ({
      ...mockDoctors[0],
      id: i + 1,
      name: `Dr. Doctor ${i + 1}`,
    }));
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue(manyDoctors);
    vi.spyOn(doctorApi, 'getSpecialties').mockResolvedValue(mockSpecialties);

    renderWithRouter(<Doctors />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next|load more/i })).toBeInTheDocument();
    });
  });
});
