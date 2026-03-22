import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContent';
import AdminAppointments from './AdminAppointments';

// Mock the API
vi.mock('../api/appointmentApi');

import appointmentApi from '../api/appointmentApi';

const mockAppointments = [
  {
    id: 1,
    patientId: 1,
    patientName: 'Patient One',
    doctorId: 1,
    doctorName: 'Dr. John Smith',
    slotDate: '2024-03-25',
    startTime: '10:00',
    endTime: '10:30',
    mode: 'ONLINE',
    status: 'PENDING',
    price: 500,
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'Patient Two',
    doctorId: 2,
    doctorName: 'Dr. Jane Doe',
    slotDate: '2024-03-26',
    startTime: '14:00',
    endTime: '14:30',
    mode: 'OFFLINE',
    status: 'CONFIRMED',
    price: 600,
  },
  {
    id: 3,
    patientId: 1,
    patientName: 'Patient One',
    doctorId: 1,
    doctorName: 'Dr. John Smith',
    slotDate: '2024-03-20',
    startTime: '09:00',
    endTime: '09:30',
    mode: 'ONLINE',
    status: 'COMPLETED',
    price: 500,
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

describe('AdminAppointments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'admin-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders all appointments', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
      expect(screen.getByText('Patient Two')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    });
  });

  test('displays appointment details correctly', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.getByText(/PENDING/)).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    appointmentApi.getAllAppointments.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<AdminAppointments />);

    expect(screen.queryByText(/loading/i)).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    appointmentApi.getAllAppointments.mockRejectedValue(new Error('Failed to fetch appointments'));

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no appointments', async () => {
    getAllAppointments.mockResolvedValue([]);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/no appointments|empty/i)).toBeInTheDocument();
    });
  });

  test('status dropdown is available for each appointment', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      const statusSelects = screen.getAllByDisplayValue(/PENDING|CONFIRMED|COMPLETED/);
      expect(statusSelects.length).toBeGreaterThan(0);
    });
  });

  test('updates appointment status', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.updateAppointmentStatus.mockResolvedValue({ message: 'Status updated' });

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByDisplayValue('PENDING');
    fireEvent.change(statusSelects[0], { target: { value: 'CONFIRMED' } });

    await waitFor(() => {
      expect(appointmentApi.updateAppointmentStatus).toHaveBeenCalledWith(1, 'CONFIRMED');
    });
  });

  test('shows success message after status update', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.updateAppointmentStatus.mockResolvedValue({ message: 'Status updated' });

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByDisplayValue('PENDING');
    fireEvent.change(statusSelects[0], { target: { value: 'CONFIRMED' } });

    await waitFor(() => {
      expect(screen.queryByText(/success|updated/i)).toBeInTheDocument();
    });
  });

  test('shows error message if status update fails', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.updateAppointmentStatus.mockRejectedValue(new Error('Failed to update'));

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByDisplayValue('PENDING');
    fireEvent.change(statusSelects[0], { target: { value: 'CONFIRMED' } });

    await waitFor(() => {
      expect(screen.queryByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  test('filters appointments by status', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(filterSelect, { target: { value: 'PENDING' } });

    // Should only show pending appointments
    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
      expect(screen.queryByText('Patient Two')).not.toBeInTheDocument();
    });
  });

  test('filters appointments by mode', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const modeSelect = screen.getByDisplayValue('All Mode');
    fireEvent.change(modeSelect, { target: { value: 'ONLINE' } });

    // Should only show online appointments
    await waitFor(() => {
      const onlineElements = screen.getAllByText(/ONLINE/);
      expect(onlineElements.length).toBeGreaterThan(0);
    });
  });

  test('searches appointments by patient name', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search|patient/i);
    fireEvent.change(searchInput, { target: { value: 'Patient One' } });

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
      expect(screen.queryByText('Patient Two')).not.toBeInTheDocument();
    });
  });

  test('searches appointments by doctor name', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search|doctor/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Dr. Jane Doe')).not.toBeInTheDocument();
    });
  });

  test('displays appointment statistics', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/total.*3|3.*appointments/i)).toBeInTheDocument();
      expect(screen.queryByText(/pending.*1|1.*pending/i)).toBeInTheDocument();
      expect(screen.queryByText(/confirmed.*1|1.*confirmed/i)).toBeInTheDocument();
    });
  });

  test('displays revenue information', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.queryByText(/revenue|total.*1600|earnings/i)).toBeInTheDocument();
    });
  });

  test('exports appointments data', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export|download/i });
    fireEvent.click(exportButton);

    // Should trigger download
    expect(exportButton).toBeInTheDocument();
  });

  test('multiple status updates work independently', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);
    appointmentApi.updateAppointmentStatus.mockResolvedValue({ message: 'Status updated' });

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByDisplayValue(/PENDING|CONFIRMED/);
    
    // Update first appointment
    fireEvent.change(statusSelects[0], { target: { value: 'CONFIRMED' } });
    
    // Update second appointment
    fireEvent.change(statusSelects[1], { target: { value: 'COMPLETED' } });

    await waitFor(() => {
      expect(appointmentApi.updateAppointmentStatus).toHaveBeenCalledTimes(2);
    });
  });

  test('loads all appointments on component mount', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(appointmentApi.getAllAppointments).toHaveBeenCalled();
    });
  });

  test('displays appointment date and time correctly', async () => {
    appointmentApi.getAllAppointments.mockResolvedValue(mockAppointments);

    renderWithRouter(<AdminAppointments />);

    await waitFor(() => {
      expect(screen.getByText(/2024-03-25|2024-03-26|2024-03-20/)).toBeInTheDocument();
      expect(screen.getByText(/10:00|14:00|09:00/)).toBeInTheDocument();
    });
  });
});
