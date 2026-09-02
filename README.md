# ChineseFlashCard 汉字 🀄

Ứng dụng web học từ vựng tiếng Trung dạng **thẻ ghi nhớ (Flashcard)**, tích hợp hệ thống ôn tập theo nhóm trí nhớ (SRS), sơ đồ mạng lưới chữ Hán, thống kê tiến độ học tập và các trò chơi luyện tập. Kèm theo một **Chrome Extension** thay thế trang New Tab để học từ vựng một cách thụ động.

> Giao diện & tài liệu của dự án sử dụng tiếng Việt.

---

## ✨ Tính năng

### Học & ôn tập
- **Flashcard** — lật thẻ học từ vựng, phát âm chuẩn (Web Speech API), màu sắc theo thanh điệu, lọc theo nhóm trí nhớ, trộn ngẫu nhiên và nhảy nhanh vị trí thẻ.
- **Nhóm trí nhớ (Memory Bucket)** — phân loại từ thành 3 nhóm:
  - 🔴 **Chưa nhớ** (`unremembered`)
  - 🟡 **Tạm nhớ** (`temporary`)
  - 🟢 **Đã nhớ** (`flashcard`)
- **Tự động Pinyin** — phân tích, chuẩn hóa dấu thanh điệu và kiểm tra trùng lặp khi thêm từ.

### Quản lý & theo dõi
- **Thêm từ vựng** — nhập Hán tự, Pinyin, nghĩa tiếng Việt.
- **Danh sách từ** — tìm kiếm, lọc, chỉnh sửa và xóa từ.
- **Thống kê & Streak** — heatmap lịch sử học, chuỗi ngày học liên tục (streak), phân bố nhóm trí nhớ.
- **Mạng lưới chữ Hán** — trực quan hóa quan hệ giữa các từ vựng có chung chữ Hán (thành tố cấu tạo).

### Trò chơi luyện tập
- 🧠 **Memory Game** — trò chơi ghép cặp Hán tự ↔ nghĩa, có combo, hiệu ứng khen thưởng, chế độ đếm ngược.
- ⌨️ **Pinyin Game** — luyện gõ Pinyin, có gợi ý, phát âm và hiệu ứng combo.

### Chrome Extension
- 🆕 **Override New Tab** — hiển thị một từ "Chưa nhớ" mỗi lần mở tab mới, giao diện dark theme.
- 👁️ Blur nghĩa/Pinyin (hover để xem), 🔊 phát âm, ⌨️ phím tắt, 🔍 tích hợp tìm kiếm Google.

---

## 🧰 Công nghệ sử dụng

| Lĩnh vực | Công nghệ |
| :--- | :--- |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Lucide React (icons) |
| Backend / Database | Supabase (PostgreSQL, Auth, Row Level Security) |
| State Management | Custom React Hooks (`useVocabStore`, `useAuth`) |
| Audio | Web Speech API (`SpeechSynthesis`) |
| API Server | Express (cho Chrome Extension) |

---

## 📁 Cấu trúc thư mục

```
ChineseFlashCard/
├── src/
│   ├── main.tsx                 # Điểm khởi chạy React
│   ├── App.tsx                  # Component gốc, điều hướng tab & xác thực
│   ├── index.css                # CSS toàn cục + Tailwind directives
│   ├── api/
│   │   └── vocab.ts             # API lấy từ "chưa nhớ" ngẫu nhiên (cho Extension)
│   ├── components/              # Các component giao diện
│   │   ├── FlashcardTab.tsx     # Màn hình học thẻ
│   │   ├── AddWordTab.tsx       # Thêm từ mới
│   │   ├── WordListTab.tsx      # Quản lý danh sách từ
│   │   ├── StatsTab.tsx         # Thống kê & heatmap
│   │   ├── CharacterNetworkTab.tsx  # Mạng lưới chữ Hán
│   │   ├── MemoryGameTab.tsx    # Trò chơi ghép cặp
│   │   ├── PinyinGameTab.tsx    # Trò chơi gõ Pinyin
│   │   ├── RewardEffects.tsx    # Hiệu ứng khen thưởng (combo, confetti)
│   │   ├── AuthScreen.tsx       # Đăng nhập / Đăng ký
│   │   └── Sidebar.tsx / Header.tsx / NavTabs.tsx
│   └── lib/
│       ├── supabase.ts          # Khởi tạo Supabase Client
│       ├── types.ts             # Các kiểu TypeScript dùng chung
│       ├── srs.ts               # Nhãn/màu nhóm trí nhớ, tiện ích ngày
│       ├── pinyin.ts            # Phân tích & chuẩn hóa Pinyin/thanh điệu
│       ├── speech.ts            # Phát âm + hiệu ứng âm thanh
│       ├── seedData.ts          # Dữ liệu từ vựng khởi tạo cho người dùng mới
│       ├── useAuth.ts           # Hook quản lý xác thực
│       ├── useVocabStore.ts     # Hook quản lý trạng thái từ vựng + đồng bộ Supabase
│       ├── useCharacterNetwork.ts # Hook phân tích mạng lưới chữ Hán
│       ├── useMemoryGame.ts     # Hook logic Memory Game
│       ├── usePinyinGame.ts     # Hook logic Pinyin Game
│       └── useRewardEffects.ts  # Hook hiệu ứng khen thưởng
├── ExtensionVocab/              # Chrome Extension (New Tab)
│   ├── manifest.json            # Manifest V3
│   ├── newtab.html / .css / .js # Giao diện + logic
│   ├── config.example.js        # Config mẫu
│   └── icons/                   # Icon
├── supabase/
│   └── migrations/              # SQL schema + RLS policies
├── server.js                    # Express server (API + CORS cho Extension)
├── vite.config.ts               # Cấu hình Vite + proxy /api
└── package.json
```

---

## 🚀 Bắt đầu

### Yêu cầu
- [Node.js](https://nodejs.org/) (>= 18)
- npm (đi kèm Node.js)
- Một dự án [Supabase](https://supabase.com/) (bắt buộc để chạy đầy đủ tính năng)

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc với các giá trị từ Supabase:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Thiết lập database (Supabase)

Chạy các file migration trong `supabase/migrations/` theo thứ tự thời gian:

1. `create_vocab_app_schema.sql` — tạo bảng `vocab`, `app_state`, `activity_log`.
2. `convert_to_multiuser.sql` — chuyển sang schema đa người dùng (gắn `user_id` + RLS).
3. `add_memory_bucket_system.sql` — thêm cột `memory_bucket`.
4. `auto_confirm_emails.sql` — tự xác nhận email khi đăng ký.
5. `drop_grammar_patterns.sql` — dọn bảng không dùng.

Bạn có thể chạy migration qua Supabase CLI hoặc dán trực tiếp vào SQL Editor của Supabase.

### 4. Chạy ứng dụng (web)

```bash
npm run dev
```

Mở http://localhost:5173 trong trình duyệt. Đăng ký tài khoản mới → hệ thống sẽ tự động seed kho từ vựng mẫu cho bạn.

---

## 🔌 Chạy API cho Chrome Extension

Server Express cung cấp endpoint cho Chrome Extension và bật CORS:

```bash
npm run dev:api
```

- Server: http://localhost:5173
- API: `GET /api/random-vocab` — trả về một từ thuộc nhóm "Chưa nhớ" ngẫu nhiên.

Ví dụ response:

```json
{
  "success": true,
  "data": {
    "hanzi": "你好",
    "pinyin": "nǐ hǎo",
    "meaning": "Xin chào"
  }
}
```

> Lưu ý: `server.js` sử dụng Vite middleware, đồng thời `vite.config.ts` cũng proxy `/api` để hỗ trợ CORS.

---

## 🧩 Cài đặt Chrome Extension

1. Mở `chrome://extensions/`.
2. Bật **Developer mode** (góc trên phải).
3. Nhấn **Load unpacked** → chọn thư mục `ExtensionVocab/`.
4. Mở tab mới (`Ctrl + T`) → thấy từ vựng!

**Phím tắt:**
- <kbd>Space</kbd> — từ tiếp theo
- <kbd>P</kbd> — phát âm
- <kbd>/</kbd> — nhảy vào ô tìm kiếm

Xem thêm hướng dẫn chi tiết tại `ExtensionVocab/README.md` và `ExtensionVocab/INSTALLATION_GUIDE.md`.

---

## 📜 Scripts

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Chạy Vite dev server (frontend) |
| `npm run dev:api` | Chạy Express server (API + CORS cho Extension) |
| `npm run build` | Build production (Vite) |
| `npm run preview` | Xem trước bản build |
| `npm run lint` | Chạy ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |

---

## 🗄️ Cấu trúc database

### Bảng `vocab`
Lưu từ vựng và trạng thái ôn tập. Các cột chính:

- `hanzi`, `pinyin`, `meaning` — nội dung từ.
- `structure` — cấu trúc thành tố chữ Hán (tùy chọn).
- `memory_bucket` — nhóm trí nhớ: `unremembered` / `temporary` / `flashcard`.
- Các cột SRS cũ (`srs_level`, `ease_factor`, `interval_days`, ...) vẫn còn để tương thích ngược.
- `user_id` — chủ sở hữu từ (tham chiếu `auth.users`).

### Bảng `app_state`
Mỗi người dùng một dòng, lưu `streak_count`, `last_activity_date`, `total_reviews`.

### Bảng `activity_log`
Mỗi người dùng một dòng/ngày, lưu số từ đã ôn (`reviewed`) và đã thêm (`added`) — dùng cho heatmap thống kê.

Tất cả các bảng đều bật **Row Level Security (RLS)**: người dùng chỉ đọc/ghi dữ liệu của chính mình (`auth.uid() = user_id`).

---

## 📚 Tài liệu liên quan

- `PROJECT_MAP.md` — bản đồ chi tiết kiến trúc & luồng dữ liệu.
- `QUICK_START.md` / `SUMMARY.txt` — tóm tắt nhanh về Chrome Extension.
- `ExtensionVocab/` — tài liệu cài đặt & cấu hình Extension.

---

**Chúc bạn học tốt tiếng Trung! 加油！(Jiā yóu)** 🎉
