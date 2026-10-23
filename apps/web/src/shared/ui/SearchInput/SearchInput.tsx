'use client';

import { useEffect, useState } from 'react';

import type { InputProps } from 'antd';
import { Input } from 'antd';

import { useDebouncedCallback } from '@/shared/lib/hooks/useDebouncedCallback';

export type SearchInputProps = Omit<InputProps, 'onChange' | 'value'> & {
  onSearch: (value: string) => void;
  debounceMs?: number;
  searchValue?: string;
};

export function SearchInput({
  onSearch,
  debounceMs = 400,
  allowClear = true,
  searchValue,
  ...inputProps
}: SearchInputProps) {
  const [draft, setDraft] = useState({
    source: searchValue,
    value: searchValue ?? '',
  });
  if (draft.source !== searchValue) {
    setDraft({ source: searchValue, value: searchValue ?? '' });
  }

  const { debouncedCallback, cancel } = useDebouncedCallback(
    onSearch,
    debounceMs,
  );

  useEffect(() => cancel, [cancel, searchValue]);

  const handleChange: NonNullable<InputProps['onChange']> = (event) => {
    if (searchValue !== undefined) {
      setDraft({ source: searchValue, value: event.target.value });
    }
    const value = event.target.value.trim();

    if (!value) {
      cancel();
      onSearch('');
      return;
    }

    debouncedCallback(value);
  };

  return (
    <Input
      {...inputProps}
      {...(searchValue !== undefined ? { value: draft.value } : {})}
      allowClear={allowClear}
      onChange={handleChange}
    />
  );
}
