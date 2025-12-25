
import { PhotoEntry } from './types';

export const INITIAL_PHOTOS: PhotoEntry[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
    title: 'Morning at the Eiffel Tower',
    description: 'Caught the first light of dawn hitting the iron structure. Simply breathtaking.',
    date: '2024-03-15',
    location: { lat: 48.8584, lng: 2.2945, name: 'Paris, France', country: 'France', region: 'Europe' },
    tags: ['landmark', 'sunrise'],
    parameters: {
      camera: 'Sony A7R IV',
      aperture: 'f/8.0',
      shutterSpeed: '1/200s',
      iso: '100',
      focalLength: '35mm'
    },
    // Fix: Added missing user_id and user_name
    user_id: 'system',
    user_name: 'Admin'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200',
    title: 'Shibuya Crossing',
    description: 'The organized chaos of Tokyo. A must-see spectacle.',
    date: '2024-04-10',
    location: { lat: 35.6595, lng: 139.7005, name: 'Tokyo, Japan', country: 'Japan', region: 'Asia' },
    tags: ['city', 'street'],
    parameters: {
      camera: 'Fujifilm X-T4',
      aperture: 'f/2.8',
      shutterSpeed: '1/1000s',
      iso: '400',
      focalLength: '23mm'
    },
    // Fix: Added missing user_id and user_name
    user_id: 'system',
    user_name: 'Admin'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1200',
    title: 'Central Park Pathways',
    description: 'A quiet escape in the middle of Manhattan.',
    date: '2023-11-20',
    location: { lat: 40.7829, lng: -73.9654, name: 'New York, USA', country: 'USA', region: 'North America' },
    tags: ['nature', 'autumn'],
    parameters: {
      camera: 'Canon EOS R5',
      aperture: 'f/4.0',
      shutterSpeed: '1/500s',
      iso: '200',
      focalLength: '50mm'
    },
    // Fix: Added missing user_id and user_name
    user_id: 'system',
    user_name: 'Admin'
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=1200',
    title: 'The Colosseum',
    description: 'Ancient history standing tall in modern Rome.',
    date: '2024-02-05',
    location: { lat: 41.8902, lng: 12.4922, name: 'Rome, Italy', country: 'Italy', region: 'Europe' },
    tags: ['history', 'architecture'],
    parameters: {
      camera: 'Leica Q2',
      aperture: 'f/1.7',
      shutterSpeed: '1/2000s',
      iso: '100',
      focalLength: '28mm'
    },
    // Fix: Added missing user_id and user_name
    user_id: 'system',
    user_name: 'Admin'
  }
];
