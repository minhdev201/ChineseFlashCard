import type { MemoryBucket } from './types';

const DAY = 24 * 60 * 60 * 1000;

const todayStr = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function memoryBucketLabel(bucket: MemoryBucket): string {
  if (bucket === 'unremembered') return 'Chưa nhớ';
  if (bucket === 'temporary') return 'Tạm nhớ';
  return 'Đã nhớ';
}

export function memoryBucketColor(bucket: MemoryBucket): string {
  if (bucket === 'unremembered') return 'text-rose-700 bg-rose-100';
  if (bucket === 'temporary') return 'text-amber-700 bg-amber-100';
  return 'text-emerald-700 bg-emerald-100';
}

export function memoryBucketDescription(bucket: MemoryBucket): string {
  if (bucket === 'unremembered') return 'Danh sách từ cần ôn tập gắt gao.';
  if (bucket === 'temporary') return 'Danh sách từ đang trong giai đoạn củng cố.';
  return 'Danh sách từ đã ghi nhớ thành công.';
}

export { DAY, todayStr, addDays };
