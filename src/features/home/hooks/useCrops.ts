import { useEffect, useState } from 'react';

import { dictionaries, type Crop } from '@/services/supabase';

export type CropOption = Pick<Crop, 'id' | 'slug' | 'name'>;

/** Список культур для чипов-фильтра на «Главной». Только эта фича их использует. */
export function useCrops() {
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dictionaries
      .getCrops()
      .then((list) => {
        if (active) setCrops(list);
      })
      .catch(() => {
        // Список культур не критичен — лента работает и без чипов-фильтра.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { crops, loading };
}
