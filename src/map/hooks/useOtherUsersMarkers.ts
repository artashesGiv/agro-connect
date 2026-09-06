import { useEffect, useState } from 'react';
import { OtherUserMarker } from '../types';
import { otherUsersRepository } from '../repository';

export function useOtherUsersMarkers() {
  const [markers, setMarkers] = useState<OtherUserMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    setLoading(true);
    try {
      const data = await otherUsersRepository.list();
      setMarkers(data);
    } catch (error) {
      console.error('Error loading other users markers:', error);
    } finally {
      setLoading(false);
    }
  };

  return { markers, loading };
}
