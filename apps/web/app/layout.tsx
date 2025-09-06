export const metadata = {
  title: "Fresh",
  description: "WT-001 onboarding demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell" }}>
        <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
