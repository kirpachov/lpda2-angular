export const SettingKeys = [
  `available_locales`,
  `default_language`,
  `max_people_per_reservation`,
  `reservation_max_days_in_advance`,
  `reservation_min_hours_advance_cancel`,
  `nexi_auto_refund_cancelled_reservations`,
  `cover_price`
] as const;

export type SettingKey = typeof SettingKeys[number];

export type Settings = Record<SettingKey, SettingValue>;

export function isSettings(v: unknown): v is Settings {
  if (!(v && typeof v == 'object')) return false;

  Object.keys(v).forEach((key: string): void | false => {
    if (!SettingKeys.includes(key as any)) return false;
  });

  return true;
}

export type SettingValue = string | number | null | string[] | number[] | Record<string, unknown>;

export interface Setting {
  key: string,
  value: SettingValue,
  // user_id: number,
  updated_at: string
}
