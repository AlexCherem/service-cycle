export const equipmentQueryKey = (companyId: string) =>
  ['equipment', companyId] as const;

export const equipmentDetailsQueryKey = (
  companyId: string,
  equipmentId: string | null,
) => [...equipmentQueryKey(companyId), 'detail', equipmentId] as const;

export const editEquipmentMutationKey = (
  companyId: string,
  equipmentId: string | null,
) => ['edit-equipment', companyId, equipmentId] as const;
