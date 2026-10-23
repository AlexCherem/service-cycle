export const clientsQueryKey = (companyId: string) =>
  ['clients', companyId] as const;

export const clientDetailsQueryKey = (
  companyId: string,
  clientId: string | null,
) => [...clientsQueryKey(companyId), 'detail', clientId] as const;

export const editClientMutationKey = (
  companyId: string,
  clientId: string | null,
) => ['edit-client', companyId, clientId] as const;
