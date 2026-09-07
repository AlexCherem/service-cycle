'use client';

import { BellOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';

const onboardingHintIcons = {
  bell: BellOutlined,
  setting: SettingOutlined,
  team: TeamOutlined,
};

export type OnboardingHintIconName = keyof typeof onboardingHintIcons;

type OnboardingHintIconProps = {
  name: OnboardingHintIconName;
};

export function OnboardingHintIcon({ name }: OnboardingHintIconProps) {
  const Icon = onboardingHintIcons[name];

  return <Icon />;
}
