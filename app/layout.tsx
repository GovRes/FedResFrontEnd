import { Roboto, Special_Elite } from "next/font/google";
import App from "./app";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const specialElite = Special_Elite({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="Website for using AI to help you apply for government jobs"
        />
        <title>GovRez</title>
      </head>
      <body className={`${roboto.className} ${specialElite.className}`}>
        <App children={props.children} />
      </body>
    </html>
  );
}
