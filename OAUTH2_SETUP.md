# OAuth2 Google Login Setup Guide

## Tại sao Google Login không hoạt động?

Google OAuth2 login yêu cầu cấu hình ở cả **Backend** và **Google Cloud Console**.

## Các bước cấu hình

### 1. Tạo Google OAuth2 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Chọn **Application type**: Web application
6. Cấu hình:
   - **Name**: TrackSpace
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:5175`
     - `http://localhost:8080`
   - **Authorized redirect URIs**:
     - `http://localhost:8080/login/oauth2/code/google`
7. Click **Create** và lưu lại:
   - Client ID
   - Client Secret

### 2. Cấu hình Backend

Mở file `backend/src/main/resources/application.properties` hoặc `application-dev.properties`:

```properties
# OAuth2 Google Configuration
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET_HERE
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}

# OAuth2 Provider
spring.security.oauth2.client.provider.google.authorization-uri=https://accounts.google.com/o/oauth2/v2/auth
spring.security.oauth2.client.provider.google.token-uri=https://oauth2.googleapis.com/token
spring.security.oauth2.client.provider.google.user-info-uri=https://www.googleapis.com/oauth2/v3/userinfo
spring.security.oauth2.client.provider.google.user-name-attribute=sub

# Authorized Redirect URIs (Frontend)
app.oauth2.authorized-redirect-uris=http://localhost:5173/oauth2/redirect,http://localhost:5175/oauth2/redirect
```

### 3. Khởi động Backend

```bash
cd backend
mvn spring-boot:run
```

Backend phải chạy ở `http://localhost:8080`

### 4. Khởi động Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy ở `http://localhost:5173` hoặc `http://localhost:5175`

### 5. Test Google Login

1. Truy cập `http://localhost:5175/login`
2. Click button **Google**
3. Chọn tài khoản Google
4. Cho phép quyền truy cập
5. Bạn sẽ được redirect về dashboard

## Luồng hoạt động

```
1. User clicks "Google" button
   ↓
2. Frontend redirects to: http://localhost:8080/oauth2/authorize/google
   ↓
3. Backend redirects to: Google OAuth2 consent screen
   ↓
4. User authorizes
   ↓
5. Google redirects to: http://localhost:8080/login/oauth2/code/google
   ↓
6. Backend processes OAuth2 callback, generates JWT
   ↓
7. Backend redirects to: http://localhost:5175/oauth2/redirect?token=JWT_TOKEN
   ↓
8. Frontend stores token and fetches user info
   ↓
9. Frontend redirects to dashboard based on role
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Kiểm tra lại **Authorized redirect URIs** trong Google Cloud Console
- Đảm bảo có: `http://localhost:8080/login/oauth2/code/google`

### Error: "unauthorized_client"
- Kiểm tra Client ID và Client Secret trong `application.properties`
- Đảm bảo không có khoảng trắng thừa

### Error: "Backend not responding"
- Kiểm tra backend đang chạy ở port 8080
- Kiểm tra CORS configuration trong `CorsConfig.java`

### User được tạo với role TEAMMEMBER
- Đây là behavior mặc định trong `OAuth2UserService.java`
- Admin có thể thay đổi role sau khi user đăng nhập lần đầu

## Security Notes

- **KHÔNG commit** Client ID và Client Secret vào Git
- Sử dụng environment variables cho production:
  ```properties
  spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
  spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
  ```
- Cập nhật `authorized-redirect-uris` cho production domain

## Production Deployment

Khi deploy lên production, cập nhật:

1. **Google Cloud Console**:
   - Thêm production domain vào Authorized JavaScript origins
   - Thêm `https://yourdomain.com/login/oauth2/code/google` vào Authorized redirect URIs

2. **Backend application.properties**:
   ```properties
   app.oauth2.authorized-redirect-uris=https://yourdomain.com/oauth2/redirect
   ```

3. **Frontend**: Cập nhật API base URL trong `.env.production`
