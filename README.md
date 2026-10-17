# ProjectHub

Web học tập qua dự án và cộng đồng. Học viên ứng tuyển vào một vai trò trong dự án thật, làm việc
nhóm theo sprint với mentor, xong thì sản phẩm nằm trong portfolio công khai của mình.

Dưới đây là cách dựng dự án trên máy bạn. Cứ làm lần lượt từ trên xuống.

## Cần có trước

- **Node.js 20.19 trở lên** (22.12+ hoặc 24 cũng được). Gõ `node -v` để kiểm tra. Bản 20 cũ hơn
  20.19 thì Prisma sẽ không chịu chạy.
- **PostgreSQL** đang chạy trên máy, hoặc một database Postgres ở đâu đó mà bạn có chuỗi kết nối.
- Tài khoản **Cloudinary** nếu bạn muốn thử tính năng upload ảnh. Chưa có cũng không sao, xem ghi
  chú ở bước 2.

## Chạy lần đầu

### 1. Cài thư viện

```bash
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` ra và điền. Hai dòng đầu là bắt buộc, thiếu là web không lên:

- `DATABASE_URL`: chuỗi kết nối Postgres, dạng
  `postgresql://USER:PASSWORD@localhost:5432/projectHub`. Thay `USER` và `PASSWORD` bằng tài khoản
  Postgres của bạn.
- `AUTH_SECRET`: một chuỗi ngẫu nhiên để NextAuth ký phiên đăng nhập. Tạo nhanh bằng lệnh này rồi
  dán kết quả vào:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

Ba dòng Cloudinary chỉ cần khi upload ảnh (avatar, ảnh bìa dự án). Lấy trong dashboard Cloudinary:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Để trống ba dòng này thì mọi thứ khác vẫn chạy, chỉ riêng nút upload ảnh sẽ báo lỗi.

Mấy dòng còn lại không bắt buộc:

- `NEXT_PUBLIC_SITE_URL`: địa chỉ công khai của web, dùng cho thẻ Open Graph. Chạy máy mình thì cứ
  để `http://localhost:3000`.
- `NEXT_PUBLIC_CONTACT_EMAIL`: email liên hệ hiện ở trang Trợ giúp.
- `JWT_SECRET` và `CLOUDINARY_URL`: có trong file mẫu nhưng code hiện không đọc tới, để trống được.

File `.env` chứa mật khẩu nên đã nằm trong `.gitignore`. Đừng commit nó.

### 3. Tạo database

Tạo một database trống có tên trùng với tên trong `DATABASE_URL`. Ví dụ trong `psql`:

```sql
CREATE DATABASE "projectHub";
```

Nhớ để tên trong dấu ngoặc kép. Không có ngoặc kép thì Postgres tự đổi thành chữ thường
(`projecthub`) và sẽ không khớp với chuỗi kết nối.

### 4. Dựng bảng và đổ dữ liệu mẫu

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Ba lệnh này lần lượt làm ba việc: sinh Prisma Client vào `app/generated/prisma`, tạo các bảng trong
database, rồi đổ dữ liệu mẫu (người dùng, dự án, task, đánh giá...). Lệnh seed chạy lại bao nhiêu
lần cũng được, nó không nhân đôi dữ liệu. Thấy dòng `Seed hoàn thành!` là xong.

### 5. Chạy

```bash
npm run dev
```

Mở <http://localhost:3000>.

## Đăng nhập thử

Sau khi seed, bạn có sẵn 10 tài khoản:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị | `admin@projecthub.vn` | `Admin@1234` |
| Mentor | `mentor.hung@projecthub.vn`, `mentor.lan@…`, `mentor.nam@…` | `Demo@1234` |
| Học viên | `learner.hoa@projecthub.vn`, `learner.khoa@…`, `learner.mai@…`, `learner.duc@…`, `learner.linh@…`, `learner.tuan@…` | `Demo@1234` |

Khi chạy `npm run dev`, trang đăng nhập có sẵn ba nút điền nhanh cho ba vai trò, khỏi phải gõ. Mấy
nút này không xuất hiện trong bản build production.

Muốn thử luồng "Quên mật khẩu" thì dùng tài khoản mentor hoặc học viên. Câu hỏi bảo mật là
“Tên nền tảng bạn đang dùng là gì?”, đáp án `projecthub`. Tài khoản admin cố ý không có câu hỏi này.

**Đây là dữ liệu mẫu. Trước khi đưa lên môi trường thật, hãy đổi mật khẩu hoặc xoá hết các tài khoản
này.**

## Hay gặp

**Báo không tìm thấy `app/generated/prisma`.** Bạn chưa chạy `npm run db:generate`. Thư mục này
được sinh ra chứ không nằm trong git, nên máy mới clone về sẽ chưa có. Mỗi lần sửa file trong
`prisma/schema` cũng phải chạy lại lệnh này.

**Lỗi kết nối database.** Kiểm tra Postgres đã bật chưa, rồi soát lại `DATABASE_URL`: user, mật
khẩu, cổng, và tên database (phân biệt hoa thường, xem bước 3).

**NextAuth báo `MissingSecret`.** `AUTH_SECRET` trong `.env` đang trống.

**Upload ảnh lỗi.** Ba biến Cloudinary chưa điền hoặc điền sai.

**Sửa `.env` rồi mà không ăn.** Tắt `npm run dev` rồi chạy lại. Next chỉ đọc `.env` lúc khởi động.

## Các lệnh

| Lệnh | Để làm gì |
| --- | --- |
| `npm run dev` | Chạy bản dev ở cổng 3000 |
| `npm run build` rồi `npm start` | Build và chạy bản production |
| `npm run lint` | Chạy ESLint |
| `npm test` | Unit test cho phần phân quyền và kiểm tra dữ liệu đầu vào |
| `npm run db:generate` | Sinh lại Prisma Client |
| `npm run db:migrate` | Áp migration vào database |
| `npm run db:seed` | Đổ dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio để xem và sửa dữ liệu bằng giao diện |

## Trong web có gì

- **Khách** xem được trang chủ, danh sách dự án (lọc, tìm kiếm, phân trang), chi tiết dự án, cộng
  đồng, bảng xếp hạng, hồ sơ công khai ở `/u/[username]`, cùng các trang trợ giúp, điều khoản, bảo
  mật.
- **Học viên** đăng ký và đăng nhập, ứng tuyển hoặc rút đơn, làm việc trên bảng Kanban, xem task
  của mình, nhận thông báo, chỉnh hồ sơ, kỹ năng, portfolio, và đánh giá thành viên lẫn mentor.
- **Mentor** tạo và sửa dự án, duyệt đơn, quản lý thành viên, sprint, tiến độ, gắn link sản phẩm
  bàn giao, và đánh giá thành viên.
- **Quản trị** xem tổng quan hệ thống, quản lý người dùng và vai trò, quản lý dự án, tạo và trao
  huy hiệu.

Điểm xếp hạng = dự án hoàn thành × 3 + điểm đánh giá trung bình × 10 + huy hiệu × 5.

## Công nghệ và cấu trúc thư mục

Next.js 16 (App Router), React 19, Tailwind CSS 4, Prisma 7 với PostgreSQL, NextAuth v5
(Credentials, JWT), Cloudinary.

Lưu ý cho ai quen Next.js bản cũ: Next 16 đổi khá nhiều thứ. Ví dụ `proxy.ts` thay cho
`middleware.ts`, còn `params` và `searchParams` giờ là Promise. Trước khi sửa code nên xem tài liệu
đi kèm trong `node_modules/next/dist/docs/`.

```text
app/(main)        Trang chủ
app/(public)      Dự án, cộng đồng, xếp hạng, hồ sơ công khai, trợ giúp, pháp lý
app/(auth)        Đăng nhập, đăng ký, quên mật khẩu
app/dashboard     Khu vực học viên và mentor
app/admin         Khu vực quản trị
app/api           Route handlers
components/       sections (landing), projects, dashboard, admin, layout, ui
lib/queries       Truy vấn Prisma dùng lại
prisma/schema     Schema tách theo miền; prisma/seedData là dữ liệu mẫu
public/images     Ảnh minh hoạ
```

## Nguồn ảnh

- Ảnh chụp trong `public/images/{hero,categories,projects}`: [Unsplash](https://unsplash.com/license) (miễn phí sử dụng).
- Avatar trong `public/images/avatars`: [DiceBear](https://www.dicebear.com) kiểu *Notionists* (CC0 1.0).
