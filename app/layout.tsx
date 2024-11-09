import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'OMS | Operations Management Service',
  description: 'Operations Management Service - Interface Management and SLA Monitoring',
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJESURBVFhH7ZY9aBRBFMf/b3Zv95KLmpgYFawEG0XBwkYQrCwEsdBCrEQQBBsLwUoQbAQrwcJSSOEHiBYiKFiIhYVgYxBiI4iFjYYk5HK3O+P7mN2Yy2QvuawHgvnDY3femzf/N7PzdmZjnHMYZSQMR44/AmLjk+C2C6k1qJYLbvsQ0oGQCqqqQUgPQnkQUkBKgOcHEFLCdV2YpgnTssCEAEL/JoQAM+xwzjA2NoZ0Oo1UKgVKNxgMEI/HEYvF4HkeGGMQQsB1Xdi2Dd/3oZSCpmme1hpKKWitoWkaqKMoCpRSMAxjqBDOOQzDQK1WQyaTged50DTiOA4cx4GUEoZhQGsdCvA8D1JKtNtttFotZLNZGhd0RCEBjDFomgbOOTRNA+ccQggIIcJQQWutoes6TNNEIpFAMplEPB6HaZowTROcc2iaFgogEbquI5FIIJlMQtd1MMbAGIMQIhRAHVprxGIxJBIJpNNppFIpJBIJWJYVhgpqg3MOy7JgWRYsy0I8Hg/bVPxXAoIggOM4sCwrDNNisRiCIEAQBPA8D77vw/d9eJ4XtqmtlEIURfB9H1EUwfd9dLtddDod9Ho9dLtddDod9Pt9RFEEpVQ4eRRFYQgppULxnHNwzqG1Rr/fR7/fR6/XQ7fbRafTQbvdRqvVQrPZRKPRQL1eR61WQ7VaRaVSQblcRqlUQrFYRKFQwPz8PBYWFrC0tITV1VWsr69jc3MTOzs72N/fx+HhIY6OjnB8fIyTkxOcnp7i7OwM5+fnuLi4wOXlJa6urvADwwn2yyeA7UAAAAAASUVORK5CYII=',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJESURBVFhH7ZY9aBRBFMf/b3Zv95KLmpgYFawEG0XBwkYQrCwEsdBCrEQQBBsLwUoQbAQrwcJSSOEHiBYiKFiIhYVgYxBiI4iFjYYk5HK3O+P7mN2Yy2QvuawHgvnDY3femzf/N7PzdmZjnHMYZSQMR44/AmLjk+C2C6k1qJYLbvsQ0oGQCqqqQUgPQnkQUkBKgOcHEFLCdV2YpgnTssCEAEL/JoQAM+xwzjA2NoZ0Oo1UKgVKNxgMEI/HEYvF4HkeGGMQQsB1Xdi2Dd/3oZSCpmme1hpKKWitoWkaqKMoCpRSMAxjqBDOOQzDQK1WQyaTged50DTiOA4cx4GUEoZhQGsdCvA8D1JKtNtttFotZLNZGhd0RCEBjDFomgbOOTRNA+ccQggIIcJQQWutoes6TNNEIpFAMplEPB6HaZowTROcc2iaFgogEbquI5FIIJlMQtd1MMbAGIMQIhRAHVprxGIxJBIJpNNppFIpJBIJWJYVhgpqg3MOy7JgWRYsy0I8Hg/bVPxXAoIggOM4sCwrDNNisRiCIEAQBPA8D77vw/d9eJ4XtqmtlEIURfB9H1EUwfd9dLtddDod9Ho9dLtddDod9Pt9RFEEpVQ4eRRFYQgppULxnHNwzqG1Rr/fR7/fR6/XQ7fbRafTQbvdRqvVQrPZRKPRQL1eR61WQ7VaRaVSQblcRqlUQrFYRKFQwPz8PBYWFrC0tITV1VWsr69jc3MTOzs72N/fx+HhIY6OjnB8fIyTkxOcnp7i7OwM5+fnuLi4wOXlJa6urvADwwn2yyeA7UAAAAAASUVORK5CYII=',
      }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}