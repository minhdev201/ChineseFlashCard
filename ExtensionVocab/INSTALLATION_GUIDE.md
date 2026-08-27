# 🎓 Chrome Extension - Học từ vựng tiếng Trung qua New Tab

## 📁 Cấu trúc dự án

```
ChineseFlashCard/
├── ExtensionVocab/              # Thư mục Chrome Extension
│   ├── manifest.json            # Cấu hình extension (Manifest V3)
│   ├── newtab.html              # Giao diện New Tab
│   ├── newtab.css               # Styles (Dark mode)
│   ├── newtab.js                # Logic JavaScript
│   ├── config.example.js        # Mẫu cấu hình
│   ├── README.md                # Hướng dẫn cài đặt extension
│   ├── API_SETUP.md             # Hướng dẫn setup API
│   └── icons/                   # Icon cho extension
│
├── src/api/vocab.ts             # API handler lấy từ vựng
├── server.js                    # Express server với CORS
└── vite.config.ts               # Vite config (updated)
```

## 🚀 Hướng dẫn cài đặt HOÀN CHỈNH

### Bước 1: Cài đặt dependencies

```bash
cd ChineseFlashCard
npm install
```

### Bước 2: Chạy API Server

Có 2 tùy chọn:

**Option A: Server với API endpoint (Khuyên dùng)**
```bash
npm run dev:api
```

**Option B: Vite dev server thông thường**
```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5173`

API endpoint: `http://localhost:5173/api/random-vocab`

### Bước 3: Load Extension vào Chrome

1. **Mở Chrome Extensions:**
   - Truy cập: `chrome://extensions/`
   - Hoặc: Menu → Extensions → Manage Extensions

2. **Bật Developer Mode:**
   - Toggle "Developer mode" ở góc trên bên phải

3. **Load Extension:**
   - Click **"Load unpacked"**
   - Chọn thư mục `ExtensionVocab`
   - Click "Select Folder"

4. **Kiểm tra:**
   - Mở tab mới → Sẽ thấy giao diện học từ vựng
   - Click "Từ tiếp theo" hoặc nhấn phím `Space`

## ✨ Tính năng

- ✅ **Override New Tab** với giao diện học từ vựng
- ✅ **Dark Mode** tối giản, dễ nhìn
- ✅ **Google Search** được tích hợp
- ✅ **API Endpoint** lấy từ vựng ngẫu nhiên từ "chưa nhớ"
- ✅ **Nghĩa làm mờ** - Hover để xem đáp án
- ✅ **Phím tắt**: `Space` = từ tiếp, `/` = tìm kiếm
- ✅ **Fallback data** khi API không khả dụng
- ✅ **CORS support** cho Chrome Extension

## 🎨 Giao diện

- **Font chữ Hán**: Noto Sans SC (rõ ràng, thanh thoát)
- **Màu nền**: Gradient dark (#0f172a → #1e293b)
- **Màu accent**: Blue (#3b82f6)
- **Hiệu ứng**: Blur nghĩa, hover để reveal

## 🔧 Cấu hình

### Thay đổi API URL (Production)

Chỉnh sửa `ExtensionVocab/newtab.js`:

```javascript
const CONFIG = {
  API_URL: 'https://your-domain.com/api/random-vocab',
  // ...
};
```

### Thêm từ vựng dự phòng

Trong `newtab.js`, chỉnh sửa mảng `FALLBACK_WORDS`:

```javascript
FALLBACK_WORDS: [
  { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
  // Thêm từ vựng khác...
]
```

## 📝 API Endpoint

### GET `/api/random-vocab`

**Response thành công:**
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

**Response lỗi:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Logic lấy dữ liệu:

1. Ưu tiên: Từ có `memory_bucket = 'unremembered'`
2. Dự phòng: Từ bất kỳ nếu không có từ "chưa nhớ"
3. Fallback: Dữ liệu trong extension nếu API lỗi

## 🎯 Cách sử dụng Extension

1. **Mở tab mới** → Từ vựng xuất hiện tự động
2. **Đoán nghĩa** → Nghĩa bị làm mờ
3. **Hover vào nghĩa** → Xem đáp án
4. **Nhấn Space** → Chuyển từ tiếp theo
5. **Nhấn /** → Focus vào ô tìm kiếm Google

## 🔨 Khắc phục sự cố

### Extension không hiện
- Kiểm tra `chrome://extensions/` → Extension có được enable không
- Reload extension bằng nút 🔄
- Xem Console (F12) để check lỗi

### Không lấy được từ vựng
- Đảm bảo server đang chạy: `npm run dev:api`
- Kiểm tra API endpoint: `http://localhost:5173/api/random-vocab`
- Extension sẽ dùng fallback data nếu API lỗi

### CORS Error
- Dùng `npm run dev:api` thay vì `npm run dev`
- Server đã có CORS headers configured
- Kiểm tra Network tab trong DevTools

### Icon không hiện
- Icons là optional, extension vẫn hoạt động
- Tạo icons theo hướng dẫn trong `icons/README.md`
- Hoặc comment out phần "icons" trong `manifest.json`

## 📦 Deployment (Production)

### 1. Deploy Backend API

Deploy Vite app + API server lên:
- **Vercel**: Hỗ trợ serverless functions
- **Netlify**: Dùng Netlify Functions
- **Railway/Render**: Deploy Node.js app
- **VPS**: Deploy với PM2

### 2. Cập nhật Extension

Sau khi deploy backend, update `newtab.js`:

```javascript
const CONFIG = {
  API_URL: 'https://your-production-url.com/api/random-vocab',
};
```

### 3. Reload Extension

- `chrome://extensions/` → Click 🔄 Reload
- Mở tab mới để test

## 📱 Phím tắt

| Phím | Chức năng |
|------|-----------|
| `Space` | Chuyển từ tiếp theo |
| `/` | Focus vào ô tìm kiếm Google |
| `Hover` | Hiện nghĩa từ (khi bị blur) |

## 🎓 Tips học tập

1. **Đoán nghĩa trước** khi hover xem đáp án
2. **Đọc to Pinyin** để luyện phát âm
3. **Viết Hán tự** ra giấy để nhớ lâu hơn
4. **Mở nhiều tab** → Lặp lại nhiều lần

## 📚 Tài nguyên bổ sung

- **Manifest V3**: [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **Vite**: [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Đóng góp

Nếu muốn cải thiện extension:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

---

**Chúc bạn học tốt tiếng Trung! 加油！🎉**

## 📞 Hỗ trợ

Gặp vấn đề? Kiểm tra:
1. Console log: F12 → Console
2. Network tab: F12 → Network
3. API endpoint: Truy cập trực tiếp trong browser
4. Extension errors: `chrome://extensions/` → Details → Errors

**Happy Learning! 🚀**
