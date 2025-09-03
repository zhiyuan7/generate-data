export enum ImageCategory {
  Yawning = 'YAWNING',
  HoldingPhone = 'HOLDING_PHONE',
  Focused = 'FOCUSED',
  Anxious = 'ANXIOUS',
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  label: string;
}
