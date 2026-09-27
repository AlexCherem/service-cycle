type ServiceDates = {
  installationDate: Date | string | null;
  lastServiceDate: Date | string | null;
  nextServiceDate: Date | string | null;
};

// Strings have already passed calendar validation and use YYYY-MM-DD.
export const getEquipmentDateErrors = (dates: ServiceDates): string[] => {
  const dateOnly = (value: Date | string | null) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value;
  const installationDate = dateOnly(dates.installationDate);
  const lastServiceDate = dateOnly(dates.lastServiceDate);
  const nextServiceDate = dateOnly(dates.nextServiceDate);
  const errors: string[] = [];

  if (
    installationDate &&
    lastServiceDate &&
    lastServiceDate < installationDate
  ) {
    errors.push(
      'Дата последнего обслуживания не может быть раньше даты установки',
    );
  }
  const referenceDate = lastServiceDate ?? installationDate;
  if (referenceDate && nextServiceDate && nextServiceDate < referenceDate) {
    errors.push(
      'Дата следующего обслуживания не может быть раньше предыдущей даты',
    );
  }
  return errors;
};
