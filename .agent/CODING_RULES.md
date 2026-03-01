# 📐 TrackSpace Coding Rules

> Đây là bộ quy tắc BẮT BUỘC cho AI agent khi làm việc trên project TrackSpace.
> AI phải ĐỌC VÀ TUÂN THỦ toàn bộ file này trước khi viết bất kỳ dòng code nào.

---

## 🏗️ 1. KIẾN TRÚC & CẤU TRÚC FILE

### 1.1 Giới hạn kích thước file
- **Component/Page tối đa 200 dòng** — nếu vượt qua PHẢI tách ra
- **Hook tối đa 80 dòng** — 1 hook = 1 trách nhiệm duy nhất
- **Service tối đa 100 dòng**
- **Dialog = 1 file riêng** — không inline dialog trong page

### 1.2 Cấu trúc Feature-Based
```
src/pages/[Feature]/
  ├── [Feature]Page.tsx          ← Orchestrator (~150 dòng)
  ├── components/
  │   ├── [Feature]CreateDialog.tsx
  │   ├── [Feature]EditDialog.tsx
  │   └── [Feature]DeleteDialog.tsx
  └── hooks/
      └── use[Feature].ts

src/types/[feature].types.ts     ← Types riêng cho mỗi domain
src/hooks/use[Feature].ts        ← Shared hooks
```

### 1.3 Barrel Exports
- Mỗi folder phải có `index.ts` nếu export nhiều hơn 1 item
- Không re-export thứ không dùng

---

## 🔷 2. TYPESCRIPT

### 2.1 Quy tắc bắt buộc
- **KHÔNG DÙNG `any`** — luôn dùng type cụ thể hoặc `unknown`
- **KHÔNG bỏ qua lỗi TypeScript** — sửa thật sự, đừng ép kiểu qua loa
- Dùng `interface` cho object shapes, `type` cho unions/aliases
- Props phải có explicit type interface:
```tsx
interface Props {
  classId: number;
  onClose: () => void;
}
const MyComponent: React.FC<Props> = ({ classId, onClose }) => { ... }
```

### 2.2 Imports
- Import types riêng với `import type { ... }`
- Chỉ import những gì thực sự dùng — không để unused imports
- Dùng absolute path alias (@/) nếu có, không dùng `../../../`

---

## 🎨 3. UI/UX — BẮT BUỘC CHUYÊN NGHIỆP

### 3.1 Nguyên tắc thiết kế
- **Không dùng màu raw** (red, blue, green) — dùng MUI theme tokens hoặc hex
- **Mọi button phải có loading state** khi đang gọi API
- **Mọi action nguy hiểm phải có ConfirmDialog** (xóa, reset, ...)
- **Empty state phải có message** — không để bảng trắng trống
- **Error state phải có message** — không để crash im lặng

### 3.2 Loading & Feedback
```tsx
// ✅ ĐÚNG: có loading + disabled
<Button variant="contained" onClick={handleSubmit} disabled={loading}>
  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
</Button>

// ❌ SAI: không có loading
<Button onClick={handleSubmit}>Lưu</Button>
```

### 3.3 Toast Notifications
- Mọi action API thành công → `toast.success()`
- Mọi action API thất bại → `toast.error(err.response?.data?.message || 'Lỗi không xác định')`
- Không dùng `alert()` hoặc `console.log()` trong production code

### 3.4 Responsive
- Luôn dùng MUI breakpoints cho spacing: `sx={{ p: { xs: 2, md: 4 } }}`
- Table trên mobile cần xem xét scroll hoặc card layout

### 3.5 Shared Components — PHẢI DÙNG
| Thay vì... | Dùng... |
|-----------|---------|
| Inline confirm dialog | `<ConfirmDialog>` |
| Custom page header | `<PageHeader>` |

---

## ⚙️ 4. LOGIC & BACKEND

### 4.1 API Calls
- **Luôn dùng `try/catch/finally`** cho async calls
- **Reset loading state trong `finally`** — không để spinner chạy mãi
- **Parallel calls dùng `Promise.all`** khi không phụ thuộc nhau:
```ts
const [classRes, groupsRes] = await Promise.all([
  classService.getClassById(id),
  groupService.getGroups(id),
]);
```

### 4.2 State Management
- **Không fetch data trong component** nếu có thể dùng custom hook
- State liên quan nhau → gom vào 1 hook, không để rải khắp component
- Cleanup effect nếu dùng subscriptions/timers

### 4.3 Error Handling
```ts
// ✅ ĐÚNG
} catch (err: unknown) {
  const message = err instanceof AxiosError 
    ? err.response?.data?.message 
    : 'Lỗi không xác định';
  toast.error(message);
}
```

---

## 🔐 5. BẢO MẬT

- **KHÔNG hardcode credentials** trong code — dùng env vars
- **KHÔNG commit** `application-local.properties` (gitignored)
- **KHÔNG log** token, password, sensitive data
- JWT token chỉ lưu ở `localStorage.getItem('token')`, không expose

---

## 📝 6. NAMING CONVENTIONS

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase | `ClassManagement.tsx` |
| Hook | camelCase với `use` | `useClassDetail.ts` |
| Service | camelCase | `classService.ts` |
| Type/Interface | PascalCase | `ClassResponse` |
| Constants | UPPER_SNAKE | `API_BASE_URL` |
| CSS class | kebab-case | `group-card__header` |

---

## ✅ 7. CHECKLIST TRƯỚC KHI PUSH CODE

- [ ] Không còn `console.log` trong code
- [ ] Không có unused imports
- [ ] Không có unused variables
- [ ] Mọi async function đều có error handling
- [ ] Loading states đã được implement
- [ ] TypeScript build không có lỗi (`npx tsc --noEmit`)
- [ ] File không vượt quá giới hạn dòng

---

## 🤖 8. QUY TẮC CHO AI AGENT

Khi viết code cho project này, AI PHẢI:

1. **Đọc file liên quan trước** khi chỉnh sửa — không đoán mò
2. **Tách dialog ra file riêng** — không inline trong page
3. **Dùng ConfirmDialog có sẵn** thay vì tạo mới
4. **Kiểm tra unused imports** trước khi submit
5. **Chạy `npx tsc --noEmit`** sau mỗi refactor lớn
6. **Báo cáo line count** khi tạo file mới (target: <200 dòng)
7. **Không tự ý thêm dependency mới** mà không hỏi user
