import { positiveInteger } from './positiveInteger';

export function listParams(params: Pick<URLSearchParams, 'get'>) {
  const page = positiveInteger(params.get('page'), 1);
  const requestedLimit = positiveInteger(params.get('limit'), 20);
  const limit = requestedLimit <= 100 ? requestedLimit : 20;
  const search = (params.get('search') ?? '').trim().slice(0, 120);

  return { page, limit, search };
}
