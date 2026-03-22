import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContent';
import MyAppointments from './MyAppointments';

// Mock the API
vi.mock('../api/appointmentApi');

import appointmentApi from '../api/appointmentApi';

const mockAppointments = [
  {
    id: 1,
    doctorId: 1,
    doctorName: 'Dr. John Smith',
    specialtyName: 'Cardiology',
    slotDate: '2024-03-25',
    startTime: '10:00',
    endTime: '10:30',
    mode: 'ONLINE',
    status: 'PENDING',
    price: 500,
  },
  {
    id: 2,
    doctorId: 2,
    doctorName: 'Dr. Jane Doe',
    specialtyName: 'Neurology',
    slotDate: '2024-03-26',
    startTime: '14:00',
    endTime: '14:30',
    mode: 'OFFLINE',
    status: 'CONFIRMED',
    price: 600,
  },
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

describe('MyAppointments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders appointment list on load', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    });
  });

  test('displays appointment details correctly', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.getByText(/PENDING/)).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    appointmentApi.getMyAppointments.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<MyAppointments />);

    expect(screen.queryByText(/loading/i)).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    appointmentApi.getMyAppointments.mockRejectedValue(new Error('Failed to fetch appointments'));

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no appointments', async () => {
    getMyAppointments.mockResolvedValue([]);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/no appointments|empty/i)).toBeInTheDocument();
    });
  });

  test('cancel button is available for PENDING appointments', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  test('cancel button is disabled for CONFIRMED appointments', async () => {
    const confirmedAppointment = [
      {
        ...mockAppointments[0],
        status: 'CONFIRMED',
      },
    ];
    getMyAppointments.mockResolvedValue(confirmedAppointment);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      // Status is CONFIRMED, so cancel might be disabled or hidden
      expect(cancelButton).toBeDisabled();
    });
  });

  test('opens confirmation modal when cancel is clicked', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure|confirm/i)).toBeInTheDocument();
    });
  });

  test('cancels appointment after confirmation', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.cancelAppointment.mockResolvedValue({ message: 'Appointment cancelled' });

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith(1);
    });
  });

  test('closes modal without cancelling on dismiss', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      const dismissButton = screen.getByRole('button', { name: /no|dismiss|close/i });
      fireEvent.click(dismissButton);
    });

    expect(appointmentApi.cancelAppointment).not.toHaveBeenCalled();
  });

  test('refreshes appointments after cancellation', async () => {
    getMyAppointments.mockResolvedValueOnce(mockAppointments);
    appointmentApi.cancelAppointment.mockResolvedValue({ message: 'Appointment cancelled' });
    getMyAppointments.mockResolvedValueOnce([mockAppointments[1]]);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Dr. John Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    });
  });

  test('shows success message after cancellation', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.cancelAppointment.mockResolvedValue({ message: 'Appointment cancelled' });

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/successfully cancelled|success/i)).toBeInTheDocument();
    });
  });

  test('shows error message if cancellation fails', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);
    cancelAppointment.mockRejectedValue(new Error('Failed to cancel'));

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/error|failed|cannot/i)).toBeInTheDocument();
    });
  });

  test('displays appointment status badges', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      expect(screen.getByText(/PENDING/)).toBeInTheDocument();
      expect(screen.getByText(/CONFIRMED/)).toBeInTheDocument();
    });
  });

  test('displays appointment mode information', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      const onlineElements = screen.getAllByText(/ONLINE/);
      const offlineElements = screen.getAllByText(/OFFLINE/);
      expect(onlineElements.length).toBeGreaterThan(0);
      expect(offlineElements.length).toBeGreaterThan(0);
    });
  });

  test('sorts appointments by date', async () => {
    appointmentApi.getMyAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<MyAppointments />);

    await waitFor(() => {
      const appointments = screen.getAllByRole('article');
      expect(appointments[0]).toHaveTextContent('Dr. John Smith');
      expect(appointments[1]).toHaveTextContent('Dr. Jane Doe');
    });
  });
});
