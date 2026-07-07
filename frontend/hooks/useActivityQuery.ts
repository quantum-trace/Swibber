import { useQuery } from '@tanstack/react-query';
import { ActivityService } from '../services/activityService';

export const useActivity = (page = 1, type?: string) =>
  useQuery({
    queryKey: ['activity', page, type],
    queryFn:  () => ActivityService.getActivity(page, type),
    staleTime: 1000 * 60 * 2,
  });
