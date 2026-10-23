import type { ReactNode } from 'react';

import { CalculatorOutlined } from '@ant-design/icons';
import type { FormInstance, FormProps } from 'antd';
import { Button, Form, InputNumber } from 'antd';

import type { UpdateEquipmentDto } from '@/shared/api/generated/models';
import { DetailsSection } from '@/shared/ui/DetailsSection';
import { FormDatePicker } from '@/shared/ui/FormDatePicker';
import { FormInput } from '@/shared/ui/FormInput';
import { FormTextArea } from '@/shared/ui/FormTextArea';

import { calculateNextServiceDate } from '../../model/calculateNextServiceDate';
import { getEquipmentDateOrderError } from '../../model/getEquipmentDateOrderError';

type EquipmentFormProps = Pick<
  FormProps<UpdateEquipmentDto>,
  'name' | 'disabled' | 'onFinish' | 'onValuesChange'
> & {
  form: FormInstance<UpdateEquipmentDto>;
  children?: ReactNode;
};

export function EquipmentForm({
  children,
  form,
  ...formProps
}: EquipmentFormProps) {
  const installationDate = Form.useWatch<
    UpdateEquipmentDto['installationDate']
  >('installationDate', form);
  const lastServiceDate = Form.useWatch<UpdateEquipmentDto['lastServiceDate']>(
    'lastServiceDate',
    form,
  );
  const nextServiceDate = Form.useWatch<UpdateEquipmentDto['nextServiceDate']>(
    'nextServiceDate',
    form,
  );

  const serviceIntervalMonths = Form.useWatch<
    UpdateEquipmentDto['serviceIntervalMonths']
  >('serviceIntervalMonths', form);
  const calculatedDate = calculateNextServiceDate({
    installationDate,
    lastServiceDate,
    serviceIntervalMonths,
  });

  function calculateDate() {
    if (!calculatedDate || formProps.disabled) return;
    form.setFieldsValue({ nextServiceDate: calculatedDate });
    formProps.onValuesChange?.(
      { nextServiceDate: calculatedDate },
      form.getFieldsValue(),
    );
  }

  return (
    <Form<UpdateEquipmentDto>
      {...formProps}
      form={form}
      layout="vertical"
      requiredMark={false}
    >
      {children}
      <DetailsSection title="Оборудование">
        <div>
          <FormInput<UpdateEquipmentDto>
            name="name"
            label="Наименование оборудования"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Введите наименование оборудования',
              },
            ]}
            inputProps={{ placeholder: 'Например, котёл Vaillant ecoTEC plus' }}
          />
          <FormInput<UpdateEquipmentDto>
            name="type"
            label="Тип"
            inputProps={{
              placeholder: 'Например, газовый котёл',
              allowClear: true,
            }}
          />
          <FormInput<UpdateEquipmentDto>
            name="manufacturer"
            label="Производитель"
            inputProps={{ placeholder: 'Например, Vaillant', allowClear: true }}
          />
          <FormInput<UpdateEquipmentDto>
            name="model"
            label="Модель"
            inputProps={{
              placeholder: 'Например, ecoTEC plus',
              allowClear: true,
            }}
          />
          <FormInput<UpdateEquipmentDto>
            name="serialNumber"
            label="Серийный номер"
            inputProps={{ allowClear: true }}
          />
        </div>
      </DetailsSection>
      <DetailsSection title="Обслуживание">
        <div>
          <Form.Item<UpdateEquipmentDto>
            name="serviceIntervalMonths"
            label="Интервал обслуживания, мес."
            rules={[
              {
                type: 'integer',
                min: 1,
                max: 2147483647,
                message: 'Введите целое число от 1 до 2147483647',
              },
            ]}
          >
            <InputNumber
              min={1}
              max={2147483647}
              style={{ width: '100%' }}
              placeholder="Например, 12"
            />
          </Form.Item>
          <FormDatePicker<UpdateEquipmentDto>
            name="installationDate"
            label="Дата установки"
            maxDate={lastServiceDate || nextServiceDate}
          />
          <FormDatePicker<UpdateEquipmentDto>
            name="lastServiceDate"
            label="Последнее обслуживание"
            minDate={installationDate}
            maxDate={nextServiceDate}
            dependencies={['installationDate']}
            rules={[
              {
                async validator() {
                  const dates = form.getFieldsValue();
                  const error = getEquipmentDateOrderError(
                    'lastServiceDate',
                    dates,
                  );
                  if (error) {
                    throw new Error(error);
                  }
                },
              },
            ]}
          />
          <FormDatePicker<UpdateEquipmentDto>
            name="nextServiceDate"
            label="Следующее обслуживание"
            action={
              <Button
                color="primary"
                variant="filled"
                icon={<CalculatorOutlined />}
                onClick={calculateDate}
                disabled={!calculatedDate || formProps.disabled}
              >
                Рассчитать
              </Button>
            }
            minDate={lastServiceDate || installationDate}
            dependencies={['installationDate', 'lastServiceDate']}
            rules={[
              {
                async validator() {
                  const dates = form.getFieldsValue();
                  const error = getEquipmentDateOrderError(
                    'nextServiceDate',
                    dates,
                  );
                  if (error) {
                    throw new Error(error);
                  }
                },
              },
            ]}
          />
          <FormTextArea<UpdateEquipmentDto>
            name="notes"
            label="Примечание"
            textAreaProps={{
              placeholder: 'Например, доступ в котельную через администратора',
              autoSize: { minRows: 3, maxRows: 6 },
            }}
          />
        </div>
      </DetailsSection>
    </Form>
  );
}
