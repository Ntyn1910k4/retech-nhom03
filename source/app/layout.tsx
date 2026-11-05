import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReTech — Thiết bị tốt. Giá trị mới.",
  description:
    "Mua bán và định giá thiết bị điện tử có nguồn tham khảo. Đồ án Nhóm 03 UTH.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
