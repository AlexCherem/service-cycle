'use client';

import type { InputProps } from 'antd';
import { Input } from 'antd';

import { useDebouncedCallback } from '@/shared/lib/hooks/useDebouncedCallback';

export type SearchInputProps = Omit<InputProps, 'onChange' | 'value'> & {
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function SearchInput({
  onSearch,
  debounceMs = 400,
  allowClear = true,
  ...inputProps
}: SearchInputProps) {
  const { debouncedCallback, cancel } = useDebouncedCallback(
    onSearch,
    debounceMs,
  );

  const handleChange: NonNullable<InputProps['onChange']> = (event) => {
    const value = event.target.value.trim();

    if (!value) {
      cancel();
      onSearch('');
      return;
    }

    debouncedCallback(value);
  };

  return (
    <Input {...inputProps} allowClear={allowClear} onChange={handleChange} />
  );
}
