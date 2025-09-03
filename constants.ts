import { ImageCategory } from './types';

export const CATEGORY_DETAILS: Record<ImageCategory, { title: string; prompts: string[] }> = {
  [ImageCategory.Yawning]: {
    title: '打哈欠',
    prompts: [
      '一张这个人的正面照片，ta正在打一个大大的哈欠，嘴巴张得很大，请确保看不到手。',
      '一张这个人的照片，ta正在打哈欠，头稍微向右傾斜，眼睛因为困倦而眯起来，请确保看不到手。',
      '一张这个人的照片，ta正打到一半，闭着眼睛，头向后仰，请确保看不到手。',
      '一张这个人的照片，ta正在打哈欠，双眼因困倦而含泪，请确保看不到手。'
    ],
  },
  [ImageCategory.HoldingPhone]: {
    title: '玩手机',
    prompts: [
      '一张这个人的照片，ta正看着智能手机，面带微笑。',
      '一张这个人的照片，ta正拿着手机打字发信息。',
      '一张这个人的照片，ta正用智能手机自拍。',
      '一张这个人的照片，ta正滑动着手机屏幕，表情平淡。'
    ],
  },
  [ImageCategory.Focused]: {
    title: '专注状态',
    prompts: [
      '一张这个人的特写肖像，表情专注而坚定，聚精会神地看着镜头外的东西，请确保看不到手。',
      '一张这个人的照片，ta正深度集中注意力，眼神明亮而锐利，表情平静，没有皱眉，请确保看不到手。',
      '一张这个人的照片，ta正全神贯注于一项任务，眼神里流露出思索的光芒，但表情是放松的，没有皱眉，请确保看不到手。',
      '一张这个人的照片，ta看起来敏锐而专注，目光锁定在目标上，准备好迎接挑战，请确保看不到手。'
    ],
  },
  [ImageCategory.Anxious]: {
    title: '焦虑皱眉',
    prompts: [
      '一张这个人的照片，ta正皱着眉头，看起来忧虑而焦虑，请确保看不到手。',
      '一张这个人的照片，ta表情关切，眉毛因思考而皱起，请确保看不到手。',
      '一张这个人的照片，ta看起来压力很大，下巴紧绷，眼神充满忧虑，请确保看不到手。',
      '一张这个人的照片，ta正皱紧眉头，轻咬嘴唇，显得非常焦虑，请确保看不到手。'
    ],
  },
};

export const CATEGORY_ORDER: ImageCategory[] = [
    ImageCategory.Yawning,
    ImageCategory.HoldingPhone,
    ImageCategory.Focused,
    ImageCategory.Anxious,
];

export const YOLO_CLASSES = [
  'yawning_face',
  'hand',
  'phone',
  'focused_face',
  'anxious_face',
];