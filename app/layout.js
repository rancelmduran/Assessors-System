import "./globals.css";

export const metadata = {
  title: "Municipal Assessor's Office - Polangui, Albay",
  description: "Public website of the Municipal Assessor's Office of Polangui, Albay.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
