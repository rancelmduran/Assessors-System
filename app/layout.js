import "./globals.css";
import Loader from "./components/Loader";

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
      <head>
        {/* Without JavaScript the loader could never dismiss itself, so hide it. */}
        <noscript>
          <style>{".site-loader{display:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <Loader />
        {children}
      </body>
    </html>
  );
}
