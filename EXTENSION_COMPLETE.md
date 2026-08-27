# 🎉 Chrome Extension - Học Từ Vựng Tiếng Trung

## ✅ ĐÃ HOÀN THÀNH

### Chrome Extension (Thư mục: ExtensionVocab/)
- ✅ manifest.json - Manifest V3 config
- ✅ newtab.html - Giao diện New Tab
- ✅ newtab.css - Dark mode styles
- ✅ newtab.js - Logic và API calls
- ✅ README.md - Hướng dẫn cài đặt
- ✅ INSTALLATION_GUIDE.md - Hướng dẫn chi tiết
- ✅ API_SETUP.md - Setup API server

### Backend API
- ✅ src/api/vocab.ts - API handler
- ✅ server.js - Express server với CORS
- ✅ vite.config.ts - Updated
- ✅ package.json - Thêm dependencies

## 🚀 CÀI ĐẶT (3 BƯỚC)

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Chạy API Server
```bash
npm run dev:api
```

Server: http://localhost:5173
API: http://localhost:5173/api/random-vocab

### Bước 3: Load Extension vào Chrome

1. Mở: `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked"
4. Chọn thư mục: `ExtensionVocab`

**Test:** Mở tab mới → Sẽ thấy từ vựng!

## ✨ Tính năng

- ✅ Override New Tab
- ✅ Dark Mode minimalist
- ✅ Google Search tích hợp
- ✅ Blur nghĩa (hover để xem)
- ✅ Phím tắt: Space = từ tiếp, / = search
- ✅ Fallback data khi API lỗi
- ✅ CORS support

## 📋 Test Checklist

- [ ] npm install đã chạy
- [ ] npm run dev:api đang chạy
- [ ] Test API: http://localhost:5173/api/random-vocab
- [ ] Extension loaded vào Chrome
- [ ] Mở tab mới → Thấy từ vựng

## 🎯 Production

Khi deploy, update `newtab.js`:
```javascript
API_URL: 'https://your-domain.com/api/random-vocab'
```

---

**Chúc học tốt! 加油！🎉**
