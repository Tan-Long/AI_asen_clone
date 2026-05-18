# Carbon Farming Data Hub

Website giới thiệu và mô phỏng nền tảng Carbon Farming cho nông nghiệp sinh thái tại tỉnh Thanh Hóa. Dự án tập trung vào trực quan hóa phát thải khí nhà kính, bản đồ nông trại, thông tin đối tác, kiến trúc hệ thống và các luồng giao diện cơ bản cho người dùng.

## Demo

Website đã được deploy bằng GitHub Pages:

https://tan-long.github.io/AI_asen_clone/

Repository:

https://github.com/Tan-Long/AI_asen_clone

## Tính năng chính

- Trang thống kê phát thải khí nhà kính tại Thanh Hóa
- Bản đồ mô phỏng phát thải theo huyện
- Các biểu đồ mô phỏng CO2, CH4, N2O, phát thải động vật và cây trồng
- Trang giới thiệu nhà tài trợ, đối tác và đội ngũ chuyên gia
- Trang mô tả kiến trúc hệ thống giám sát carbon
- Trang FAQ và form góp ý sản phẩm
- Giao diện đăng nhập, đăng ký và dashboard nông trại mô phỏng
- Hỗ trợ tiếng Việt và tiếng Anh ở các phần nội dung chính
- Responsive cho desktop và mobile

## Các trang

| Route | Nội dung |
| --- | --- |
| `/` | Thống kê, bản đồ và biểu đồ phát thải |
| `/app` | Dashboard nông trại mô phỏng |
| `/about-us` | Nhà tài trợ, đối tác, chuyên gia |
| `/architecture` | Kiến trúc hệ thống giám sát carbon |
| `/frequently-asked-questions` | Câu hỏi thường gặp |
| `/feedback` | Form góp ý sản phẩm |
| `/login` | Giao diện đăng nhập |
| `/signup` | Giao diện đăng ký |

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui conventions
- Lucide React icons
- GitHub Actions + GitHub Pages

## Yêu cầu môi trường

- Node.js 24 hoặc mới hơn
- npm

## Chạy local

```bash
npm install
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm run build
```

Hoặc chạy toàn bộ:

```bash
npm run check
```

## Build production

```bash
npm run build
```

Dự án đang dùng static export (`output: "export"`) để phù hợp với GitHub Pages. Khi build trên GitHub Actions, app được cấu hình `basePath` là `/AI_asen_clone` để các route, script và ảnh public hoạt động đúng trên URL GitHub Pages.

## Deploy

Deploy tự động chạy khi push lên nhánh `main`.

Workflow chính:

```text
.github/workflows/deploy-pages.yml
```

Luồng deploy:

1. Checkout source code
2. Cài Node.js 24
3. Cài dependencies bằng `npm ci`
4. Build static site bằng `npm run build`
5. Upload thư mục `out`
6. Deploy lên GitHub Pages

## Cấu trúc dự án

```text
src/
  app/                         # Next.js routes
  components/greenfarming/     # Component chính của website
  lib/                         # Data, helper path, utility
  types/                       # TypeScript types
public/
  images/greenfarming/         # Ảnh và asset của website
.github/workflows/
  ci.yml                       # Lint, typecheck, build
  deploy-pages.yml             # Deploy GitHub Pages
```

## Ghi chú

Dự án là bản clone/mô phỏng giao diện Carbon Farming phục vụ trình diễn frontend. Các biểu đồ, bản đồ, form đăng nhập và form góp ý hiện là giao diện mô phỏng, chưa kết nối backend hoặc cơ sở dữ liệu thật.

## License

MIT
