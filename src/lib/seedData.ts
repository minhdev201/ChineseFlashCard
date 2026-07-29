export interface SeedWord {
  hanzi: string;
  pinyin: string;
  hanviet: string;
  meaning: string;
  example: string;
}

export const SEED_WORDS: SeedWord[] = [
  { hanzi: '你好', pinyin: 'nǐ hǎo', hanviet: 'nỉ hảo', meaning: 'Xin chào', example: '你好，我是小明。' },
  { hanzi: '谢谢', pinyin: 'xiè xie', hanviet: 'tạ tạ', meaning: 'Cảm ơn', example: '谢谢你的帮助。' },
  { hanzi: '再见', pinyin: 'zài jiàn', hanviet: 'tái kiến', meaning: 'Tạm biệt', example: '我们明天再见。' },
  { hanzi: '学习', pinyin: 'xué xí', hanviet: 'học tập', meaning: 'Học tập', example: '我每天学习中文。' },
  { hanzi: '中国', pinyin: 'zhōng guó', hanviet: 'trung quốc', meaning: 'Trung Quốc', example: '中国很大。' },
  { hanzi: '老师', pinyin: 'lǎo shī', hanviet: 'lão sư', meaning: 'Giáo viên', example: '她是我的老师。' },
  { hanzi: '学生', pinyin: 'xué shēng', hanviet: 'học sinh', meaning: 'Học sinh', example: '他是一个好学生。' },
  { hanzi: '朋友', pinyin: 'péng yǒu', hanviet: 'bằng hữu', meaning: 'Bạn bè', example: '你是我的好朋友。' },
  { hanzi: '吃饭', pinyin: 'chī fàn', hanviet: 'xuyết phạn', meaning: 'Ăn cơm', example: '我们一起吃饭吧。' },
  { hanzi: '喜欢', pinyin: 'xǐ huan', hanviet: 'hỉ hoan', meaning: 'Thích', example: '我喜欢喝茶。' },
  { hanzi: '水', pinyin: 'shuǐ', hanviet: 'thủy', meaning: 'Nước', example: '请给我一杯水。' },
  { hanzi: '书', pinyin: 'shū', hanviet: 'thư', meaning: 'Sách', example: '这是一本好书。' },
  { hanzi: '爱', pinyin: 'ài', hanviet: 'ái', meaning: 'Yêu', example: '我爱你。' },
  { hanzi: '家', pinyin: 'jiā', hanviet: 'gia', meaning: 'Nhà', example: '我回家。' },
  { hanzi: '时间', pinyin: 'shí jiān', hanviet: 'thời gian', meaning: 'Thời gian', example: '时间过得很快。' },
  { hanzi: '工作', pinyin: 'gōng zuò', hanviet: 'công tác', meaning: 'Công việc / Làm việc', example: '我每天工作。' },
  { hanzi: '今天', pinyin: 'jīn tiān', hanviet: 'kim thiên', meaning: 'Hôm nay', example: '今天天气很好。' },
  { hanzi: '明天', pinyin: 'míng tiān', hanviet: 'minh thiên', meaning: 'Ngày mai', example: '明天见。' },
  { hanzi: '什么', pinyin: 'shén me', hanviet: 'thập ma', meaning: 'Cái gì', example: '你说什么？' },
  { hanzi: '怎么', pinyin: 'zěn me', hanviet: 'chẩm ma', meaning: 'Thế nào / Làm sao', example: '你怎么了？' },
];
