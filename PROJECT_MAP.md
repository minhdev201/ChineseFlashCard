# PROJECT MAP

## 1. Tổng quan & Stack
- **Mục đích dự án**: Ứng dụng web học từ vựng tiếng Trung dạng thẻ ghi nhớ (Flashcard) tích hợp thuật toán ôn tập ngắt quãng (SM-2 SRS), sơ đồ mạng lưới chữ Hán và bảng theo dõi thống kê tiến độ học tập.
- **Công nghệ cốt lõi**:
  - **Frontend Framework**: React 18, TypeScript, Vite.
  - **Styling & UI Components**: Tailwind CSS, Lucide React icons.
  - **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security).
  - **State Management**: Custom React Hooks (`useVocabStore`, `useAuth`) kết hợp Supabase JavaScript Client.
  - **Audio / Web Speech API**: Browser Native SpeechSynthesis API.

---

## 2. Bản đồ Thư mục & Vai trò (Directory Architecture)
- `index.html`: Tệp HTML gốc đóng vai trò là điểm truy cập chính cho ứng dụng Vite.
- `src/`
  - `main.tsx`: Điểm khởi chạy ứng dụng React và gắn component gốc App vào DOM.
  - `App.tsx`: Component gốc quản lý luồng đăng nhập, điều hướng các tab tính năng và render khung giao diện chính.
  - `index.css`: Tệp CSS toàn cục khai báo các chỉ thị Tailwind CSS và kiểu dáng giao diện tùy chỉnh.
  - `components/`
    - `AddWordTab.tsx`: Component giao diện cho phép người dùng thêm từ vựng mới vào kho từ.
    - `AuthScreen.tsx`: Màn hình xác thực xử lý các thao tác đăng nhập và đăng ký tài khoản cho người dùng.
    - `CharacterNetworkTab.tsx`: Component trực quan hóa sơ đồ mạng lưới các chữ Hán và từ vựng có chung thành tố cấu tạo.
    - `FlashcardTab.tsx`: Màn hình lật thẻ học từ vựng hỗ trợ đánh giá SRS, bộ lọc nhóm trí nhớ (Tất cả, Chưa nhớ, Tạm nhớ, Đã nhớ), màu sắc theo thanh điệu và phát âm audio.
    - `Header.tsx`: Component thanh tiêu đề ứng dụng hiển thị streak học tập và menu người dùng.
    - `NavTabs.tsx`: Component điều hướng dạng tab cho giao diện màn hình di động.
    - `Sidebar.tsx`: Thanh điều hướng cố định bên hông cung cấp menu chính, chỉ số thống kê và thao tác tài khoản.
    - `StatsTab.tsx`: Bảng thống kê hiển thị lịch sử học tập dạng heatmap, streak và phân bố nhóm trí nhớ (Chưa nhớ, Tạm nhớ, Đã nhớ).
    - `WordListTab.tsx`: Giao diện quản lý danh sách từ vựng hỗ trợ tìm kiếm, lọc, chỉnh sửa và xóa từ.
  - `lib/`
    - `pinyin.ts`: Bộ tiện ích phân tích chuỗi Pinyin, định dạng dấu thanh điệu và gán màu sắc giao diện tương ứng.
    - `seedData.ts`: Tập hợp dữ liệu từ vựng tiếng Trung mặc định ban đầu để khởi tạo cho người dùng mới.
    - `speech.ts`: Tiện ích giao tiếp với Web Speech API hỗ trợ phát âm từ vựng tiếng Trung.
    - `srs.ts`: Mô-đun tính toán thuật toán SM-2 SRS xác định khoảng thời gian lặp lại ngắt quãng tiếp theo và chuyển đổi nhãn nhóm trí nhớ (Chưa nhớ, Tạm nhớ, Đã nhớ).
    - `supabase.ts`: Tệp khởi tạo Supabase Client phục vụ các yêu cầu truy vấn CSDL và xác thực.
    - `types.ts`: Định nghĩa tập hợp các kiểu dữ liệu TypeScript dùng chung trong toàn bộ dự án.
    - `useAuth.ts`: Custom hook quản lý phiên đăng nhập và các thao tác xác thực với Supabase Auth.
    - `useCharacterNetwork.ts`: Custom hook xử lý dữ liệu các nút và liên kết đồ thị cho sơ đồ mạng lưới chữ Hán.
    - `useVocabStore.ts`: Custom hook quản lý toàn bộ trạng thái dữ liệu từ vựng và đồng bộ trực tiếp với Supabase.
- `supabase/`
  - `migrations/`: Thư mục chứa các bản kịch bản SQL định nghĩa cấu trúc bảng và chính sách bảo mật RLS.
- `vite.config.ts`: Tệp cấu hình xây dựng ứng dụng của Vite và thiết lập các alias đường dẫn.
- `tailwind.config.js`: Tệp cấu hình giao diện, bảng màu và quy tắc lớp tiện ích của Tailwind CSS.

---

## 3. Luồng dữ liệu chính (Core Data Flow)

1. **Luồng Xác thực người dùng (Authentication Flow)**:
   `User Input (Email / Password)` -> `AuthScreen` -> `useAuth Hook` -> `Supabase Auth API` -> `Session State Updated` -> `App.tsx (Render Layout)`

2. **Luồng Ôn tập Flashcard & Cập nhật SRS (SRS Flashcard Review Flow)**:
   `User Feedback Rating (Chưa nhớ / Tạm nhớ / Đã nhớ)` -> `FlashcardTab` -> `srs.ts (Calculate next review date & ease factor)` -> `useVocabStore (Update State)` -> `Supabase Database (Tables: vocab, activity_log, app_state)` -> `UI Re-render`

3. **Luồng Thêm & Quản lý Từ vựng (Vocab Management Flow)**:
   `User Submit Form` -> `AddWordTab / WordListTab` -> `pinyin.ts (Parse Pinyin & Tones)` -> `useVocabStore` -> `Supabase Database (Table: vocab)` -> `Local Store Synchronized` -> `UI Refresh`

---

## 4. Bảng tra cứu Module (Module Lookup Table)

| Module / Tính năng | File / Thư mục liên quan | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Xác thực người dùng** | `src/components/AuthScreen.tsx`<br>`src/lib/useAuth.ts`<br>`src/lib/supabase.ts` | Quản lý luồng đăng nhập, đăng ký, đăng xuất và duy trì phiên làm việc người dùng. |
| **Ôn tập thẻ ghi nhớ (SRS)** | `src/components/FlashcardTab.tsx`<br>`src/lib/srs.ts`<br>`src/lib/pinyin.ts`<br>`src/lib/speech.ts` | Hiển thị thẻ học, phát âm tiếng Trung, phân tích thanh điệu, lọc từ vựng theo nhóm (Tất cả / Chưa nhớ / Tạm nhớ / Đã nhớ) và cập nhật chu kỳ ôn tập theo SM-2. |
| **Thêm & Tự động Pinyin** | `src/components/AddWordTab.tsx`<br>`src/lib/useVocabStore.ts`<br>`src/lib/pinyin.ts` | Cho phép nhập từ mới, kiểm tra trùng lặp từ vựng và tự động xử lý ký tự Pinyin. |
| **Quản lý kho từ vựng** | `src/components/WordListTab.tsx`<br>`src/lib/useVocabStore.ts` | Cung cấp giao diện bảng xem danh sách, lọc theo nhóm ghi nhớ, tìm kiếm, sửa và xóa từ. |
| **Mạng lưới chữ Hán** | `src/components/CharacterNetworkTab.tsx`<br>`src/lib/useCharacterNetwork.ts` | Phân tích quan hệ bộ thủ/chữ ghép và trực quan hóa sơ đồ liên kết giữa các chữ Hán. |
| **Thống kê & Streak** | `src/components/StatsTab.tsx`<br>`src/components/Sidebar.tsx`<br>`src/lib/useVocabStore.ts` | Tính toán chuỗi ngày học liên tục (streak), vẽ biểu đồ nhiệt đóng góp và phân tích tỷ lệ nhóm trí nhớ. |
| **Quản lý State & Database** | `src/lib/useVocabStore.ts`<br>`src/lib/types.ts`<br>`supabase/migrations/` | Quản lý state tập trung, tự động chèn dữ liệu khởi tạo (seed) và thực hiện câu lệnh CRUD với CSDL. |
