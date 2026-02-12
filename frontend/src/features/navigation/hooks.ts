import { useQuery } from '@tanstack/react-query';
import { getNavigation } from './api';

export const useNavigation = () =>
  useQuery({
    queryKey: ['navigation'],
    queryFn: getNavigation,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
