import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormInstance } from 'antd';
import { Alert, Form } from 'antd';

import { EquipmentForm } from '@/entities/equipment';
import { ApiError } from '@/shared/api';
import { clientsQueryKey } from '@/shared/api/clients';
import {
  editEquipmentMutationKey,
  equipmentDetailsQueryKey,
  equipmentQueryKey,
  updateEquipment,
} from '@/shared/api/equipment';
import type {
  EquipmentDetailsResponseDto,
  UpdateEquipmentDto,
} from '@/shared/api/generated/models';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';

import { getEquipmentChanges } from '../../model/getEquipmentChanges';

type EditEquipmentFormProps = {
  form: FormInstance<UpdateEquipmentDto>;
  companyId: string;
  equipment: EquipmentDetailsResponseDto;
  onCancel: () => void;
  onSuccess: () => void;
};

export function EditEquipmentForm({
  form,
  companyId,
  equipment,
  onCancel,
  onSuccess,
}: EditEquipmentFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: editEquipmentMutationKey(companyId, equipment.id),
    mutationFn: (data: UpdateEquipmentDto) =>
      updateEquipment(equipment.id, data),
    retry: false,
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        equipmentDetailsQueryKey(companyId, equipment.id),
        updated,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: equipmentQueryKey(companyId),
        }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKey(companyId) }),
      ]);
    },
  });

  function handleFinish(values: UpdateEquipmentDto) {
    if (mutation.isPending) return;
    const changes = getEquipmentChanges(values, equipment);
    if (!Object.keys(changes).length) {
      onCancel();
      return;
    }
    mutation.mutate(changes, { onSuccess });
  }

  const errorMessage =
    mutation.error instanceof ApiError && mutation.error.status === 401
      ? 'Сессия истекла. Войдите снова, чтобы сохранить изменения.'
      : mutation.error instanceof ApiError && mutation.error.status === 404
        ? 'Оборудование больше недоступно. Закройте карточку и обновите список.'
        : getApiErrorMessage(
            mutation.error,
            'Не удалось сохранить оборудование. Попробуйте ещё раз.',
          );

  return (
    <EquipmentForm
      form={form}
      name="edit-equipment"
      disabled={mutation.isPending}
      onFinish={handleFinish}
      onValuesChange={() => {
        if (mutation.isError) mutation.reset();
      }}
    >
      {mutation.isError && (
        <Form.Item>
          <Alert type="error" showIcon title={errorMessage} />
        </Form.Item>
      )}
    </EquipmentForm>
  );
}
