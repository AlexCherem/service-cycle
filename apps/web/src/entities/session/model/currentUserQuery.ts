import { queryOptions } from '@tanstack/react-query';

import { getCurrentUser } from '@/shared/api';

export const currentUserQueryKey = ['session', 'current-user'] as const;

export const currentUserQueryOptions = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: getCurrentUser,
  retry: false,
});
