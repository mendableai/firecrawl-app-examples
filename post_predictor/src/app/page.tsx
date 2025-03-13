// pages/index.tsx
import MainComponent from "@/components/main";
import { useGithubStars } from "./hooks/useGithubStars";
import GithubButton from "@/components/github-button";

export default async function Home() {
  return (
    <div className="relative">
      <MainComponent />
    </div>
  );
}
