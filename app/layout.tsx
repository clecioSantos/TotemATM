import { AuthProvider } from "@totem/shared/types/AuthProvider";
import "./globals.css";

export const metadata = {
  title: 'Bora De Delivery',
  description: 'Seu delivery favorito',
  icons: {
    icon: '/Icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/Icon.png" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
