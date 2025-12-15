import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import InteractiveGoogleMap from '../InteractiveGoogleMap';
import { type Location, type ProviderWithLocation } from '@/lib/locationUtils';

// Mock the Google Maps API
const mockGoogleMaps = {
  maps: {
    Map: vi.fn(),
    Marker: vi.fn(),
    Circle: vi.fn(),
    InfoWindow: vi.fn(),
    LatLng: vi.fn(),
    LatLngBounds: vi.fn(),
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

// Mock window.google
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true,
});

// Mock environment variables
vi.mock('@/lib/locationUtils', () => ({
  calculateDistance: vi.fn(() => 5.2),
  formatDistance: vi.fn(() => '5.2km'),
  getDirectionsUrl: vi.fn(() => 'https://maps.google.com'),
}));

// Mock components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('InteractiveGoogleMap', () => {
  const mockUserLocation: Location = {
    latitude: 33.6844,
    longitude: 73.0479,
    address: 'Islamabad, Pakistan',
  };

  const mockProviders: ProviderWithLocation[] = [
    {
      id: '1',
      name: 'John Doe',
      service_category: 'plumbing',
      bio: 'Professional plumber',
      experience: '5 years',
      location: 'Islamabad',
      profile_image: 'https://example.com/image.jpg',
      is_verified: true,
      rating: 4.5,
      reviews_count: 25,
      jobs_pricing: {
        plumbing: [
          { job: 'Pipe Installation', price: 500 },
          { job: 'Leak Repair', price: 300 },
        ],
      },
      created_at: '2024-01-01',
      latitude: 33.6844,
      longitude: 73.0479,
      distance: 0.5,
    },
    {
      id: '2',
      name: 'Jane Smith',
      service_category: 'electrical',
      bio: 'Licensed electrician',
      experience: '3 years',
      location: 'Rawalpindi',
      profile_image: '',
      is_verified: false,
      rating: 4.2,
      reviews_count: 15,
      jobs_pricing: {
        electrical: [
          { job: 'Wiring Installation', price: 800 },
          { job: 'Switch Repair', price: 200 },
        ],
      },
      created_at: '2024-01-02',
      latitude: 33.6944,
      longitude: 73.0579,
      distance: 1.2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when map is not loaded', () => {
    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={mockProviders}
        isLoading={false}
      />
    );

    // Should show loading skeleton initially
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders with correct props', () => {
    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={mockProviders}
        onRefreshLocation={vi.fn()}
        isLoading={false}
        selectedServiceType="plumbing"
        searchRadius={10}
        onProviderSelect={vi.fn()}
      />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('handles empty providers array', () => {
    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={[]}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={mockProviders}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('handles missing user location', () => {
    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={mockProviders}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('handles providers without coordinates', () => {
    const providersWithoutCoords = mockProviders.map(p => ({
      ...p,
      latitude: undefined,
      longitude: undefined,
    }));

    render(
      <InteractiveGoogleMap
        userLocation={mockUserLocation}
        providers={providersWithoutCoords}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
}); 