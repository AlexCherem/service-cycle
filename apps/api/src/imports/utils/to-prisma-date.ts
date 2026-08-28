export const toPrismaDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
};
