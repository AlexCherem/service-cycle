export const equipmentQueryKey = (companyId: string) =>
  ['equipment', companyId] as const;

export const equipmentDetailsQueryKey = (
  companyId: string,
  equipmentId: string | null,
) => [...equipmentQueryKey(companyId), 'detail', equipmentId] as const;
