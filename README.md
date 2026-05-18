# Hạt Gạo Ngày Mai / The Grain of Tomorrow

Demo song ngữ cho hệ thống cảnh báo sớm rủi ro arsenic trong gạo Việt Nam dưới các kịch bản khí hậu. Website trình bày cách AI có thể hỗ trợ phân tích kịch bản, ưu tiên lấy mẫu và truyền thông rủi ro, nhưng không thay thế xét nghiệm phòng lab.

## Demo

Website đã deploy bằng GitHub Pages:

https://tan-long.github.io/AI_asen_clone/

Repository:

https://github.com/Tan-Long/AI_asen_clone

## Điểm chính

- Brand: **Hạt Gạo Ngày Mai / The Grain of Tomorrow**
- Tagline: **AI early-warning system for arsenic risk in rice**
- Dataset: **1,327 rice samples, 2017-2025**
- Model samples: **946 loc.5 locations**
- Projection instances: **18,920**
- Model: **Gaussian Process Regression**
- Inputs: **24 predictors**
- Validation: **CV R² ≈ 0.365**
- Scenarios: **RCP4.5** và **RCP8.5** đến năm **2050**
- Results: **0.21**, **0.268**, **0.304 mg/kg**

## Nội dung website

| Route | Nội dung |
| --- | --- |
| `/` | Landing page, bản đồ rủi ro minh họa, kết quả kịch bản và biểu đồ |
| `/app` | Product dashboard mock với scenario selector, region selector, risk summary và chatbot panel |
| `/architecture` | Pipeline AI: ingestion, cleaning, GPR, SHAP, uncertainty, retraining, RAG chatbot |
| `/about-us` | Giới thiệu dự án, dữ liệu, mục tiêu GIC và giới hạn minh bạch |
| `/frequently-asked-questions` | FAQ về arsenic, AI, dashboard, chatbot và giới hạn mô hình |
| `/feedback` | Form góp ý cho demo cảnh báo arsenic |
| `/login` | Mock login flow |
| `/signup` | Mock signup flow |

## Định vị

Demo này là hệ thống cảnh báo sớm và ưu tiên lấy mẫu. Kết quả mô hình giúp người dùng xem vùng nào nên được quan tâm trước khi lập kế hoạch khảo sát hoặc xét nghiệm. Mọi quyết định an toàn thực phẩm cần được xác minh bằng xét nghiệm phòng lab.

Bản đồ/heatmap trong website là visualization minh họa dựa trên kết quả dự án, không phải GIS chính thức.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- Lucide React icons
- GitHub Actions + GitHub Pages

## Chạy local

Yêu cầu Node.js 24 hoặc mới hơn.

```bash
npm install
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
```

Hoặc:

```bash
npm run check
```

## Deploy

Dự án dùng Next.js static export để chạy trên GitHub Pages. Khi build trong GitHub Actions, `basePath` được đặt là `/AI_asen_clone` để route và asset hoạt động đúng tại:

```text
https://tan-long.github.io/AI_asen_clone/
```

Workflow deploy:

```text
.github/workflows/deploy-pages.yml
```

Deploy tự động chạy khi push lên nhánh `main`.

## Cấu trúc chính

```text
src/
  app/                         # Next.js routes
  components/greenfarming/     # UI chính của demo
  lib/greenfarming-data.ts     # Nội dung song ngữ và số liệu demo
  lib/public-path.ts           # Helper basePath cho GitHub Pages
  types/                       # TypeScript types
public/
  images/greenfarming/         # Asset tạm/placeholder
.github/workflows/
  ci.yml
  deploy-pages.yml
```

## License

MIT
