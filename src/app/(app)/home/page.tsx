import type { Metadata } from "next";
import { HomeFeed } from "./home-feed";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main className="page-safe-bottom">
      <HomeFeed />
    </main>
  );
}
