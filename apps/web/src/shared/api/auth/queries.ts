import { queryOptions } from '@tanstack/react-query';

import { getCurrentUser } from './auth';
import { currentUserQueryKey } from './keys';

export const currentUserQueryOptions = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: getCurrentUser,
  retry: false,
});
