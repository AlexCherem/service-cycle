'use client';

import { useRouter } from 'next/navigation';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';

export type ButtonLinkProps = Omit<ButtonProps, 'href' | 'onClick'> & {
  href: string;
  onClick?: ButtonProps['onClick'];
};

export function ButtonLink({
  href,
  onClick,
  target,
  ...buttonProps
}: ButtonLinkProps) {
  const router = useRouter();

  const handleClick: NonNullable<ButtonProps['onClick']> = (event) => {
    onClick?.(event);

    const shouldUseBrowserNavigation =
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target !== undefined && target !== '_self');

    if (shouldUseBrowserNavigation) {
      return;
    }

    event.preventDefault();
    router.push(href);
  };

  return (
    <Button
      {...buttonProps}
      href={href}
      onClick={handleClick}
      target={target}
    />
  );
}
