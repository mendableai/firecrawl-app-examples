"use client";

import { useEffect, useRef, useState } from "react";
import { Theme, allThemes } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { FaCircleInfo, FaRegCircleQuestion, FaXTwitter } from "react-icons/fa6";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaKey } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PredictionData {
  viralityScore: number;
  trendingScore: number;
  contentScore: number;
  analysis: string;
  maxLikesIn24Hours: number[];
  hourlyLikes: number[];
}

export default function MainComponent() {
  const [tweetIdea, setTweetIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(
    null
  );
  const [loadingMessage, setLoadingMessage] = useState(
    "Analyzing your tweet..."
  );
  const chartRef = useRef(null);
  const [visibleDataPoints, setVisibleDataPoints] = useState(0);
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  useEffect(() => {
    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem("firecrawlApiKey");
    if (savedApiKey) {
      setFirecrawlApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      const messages = [
        "Analyzing your tweet...",
        "Checking current trends...",
        "Calculating virality score...",
        "Evaluating content...",
      ];
      let messageIndex = 0;

      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (predictionData) {
      setVisibleDataPoints(0);
      const interval = setInterval(() => {
        setVisibleDataPoints((prev) => {
          if (prev >= 24) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [predictionData]);

  const saveApiKey = () => {
    setFirecrawlApiKey(tempApiKey);
    localStorage.setItem("firecrawlApiKey", tempApiKey);
    setIsDialogOpen(false);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#333",
        },
        ticks: {
          color: "#999",
        },
      },
      x: {
        grid: {
          color: "#333",
        },
        ticks: {
          color: "#999",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white font-helvetica">
      <main className="max-w-3xl mx-auto pt-4 px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold">
            Post Predictor by{" "}
            <a
              href="https://firecrawl.dev"
              className="text-orange-500 hover:text-orange-400"
            >
              Firecrawl
            </a>{" "}
            🔥
          </h1>
        </div>

        <div className="border border-neutral-800 rounded-xl p-4">
          <textarea
            className="w-full h-32 resize-none text-xl bg-transparent border-none focus:ring-0 placeholder:text-neutral-600 font-helvetica"
            placeholder="What's happening?"
            value={tweetIdea}
            onChange={(e) => setTweetIdea(e.target.value)}
          />

          <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <FaXTwitter size={20} />
              <span className="text-sm font-helvetica">
                {280 - tweetIdea.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-black border border-orange-500 text-orange-500 hover:bg-black/80 hover:text-orange-400 flex items-center group relative"
                    onClick={() => {
                      setTempApiKey(firecrawlApiKey);
                      setIsDialogOpen(true);
                    }}
                  >
                    <FaKey className="mr-1" />
                    {firecrawlApiKey
                      ? "Firecrawl Key Set"
                      : "Enhance Analysis with Firecrawl"}
                    <div className="ml-1">
                      <FaRegCircleQuestion className="h-3.5 w-3.5" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-96 bg-neutral-900 text-sm p-2 rounded-lg border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Includes trends from news websites instead of only X data
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Firecrawl API Key
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Enter your Firecrawl API key to enhance trend analysis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      type="password"
                      placeholder="Enter your Firecrawl API key"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      Your API key is stored locally and never sent to our
                      servers. Get your API key at{" "}
                      <a
                        href="https://firecrawl.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:text-orange-400"
                      >
                        firecrawl.dev
                      </a>
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveApiKey}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                className="bg-neutral-50 hover:bg-neutral-200 text-black rounded-full px-6 font-bold font-helvetica"
                onClick={async () => {
                  if (tweetIdea) {
                    setLoading(true);
                    try {
                      const payload: { tweetIdea: string; apiKey?: string } = {
                        tweetIdea,
                      };

                      // Add API key to payload if available
                      if (firecrawlApiKey) {
                        payload.apiKey = firecrawlApiKey;
                      }

                      const response = await fetch("/api/predictpost", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });

                      if (!response.ok) {
                        throw new Error("Failed to analyze tweet");
                      }

                      const data = await response.json();
                      setPredictionData(data);
                    } catch (error) {
                      console.error("Error:", error);
                      alert("An error occurred while analyzing your tweet.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              >
                {loading ? "Analyzing..." : "Predict"}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 p-4 border border-neutral-800 rounded-xl bg-neutral-900">
            <p className="text-neutral-400 text-center font-helvetica">
              {loadingMessage}
            </p>
          </div>
        ) : (
          predictionData && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 border border-neutral-800 rounded-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium font-helvetica">
                      Virality Score
                    </span>
                    <span className="text-neutral-400">
                      {predictionData.viralityScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium font-helvetica">
                      Trending Potential
                    </span>
                    <span className="text-neutral-400">
                      {predictionData.trendingScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium font-helvetica">
                      Content Quality
                    </span>
                    <span className="text-neutral-400">
                      {predictionData.contentScore}/100
                    </span>
                  </div>
                  <div className="pt-4 border-t border-neutral-800">
                    <p className="font-medium mb-2 font-helvetica">Analysis</p>
                    <p className="text-neutral-400 font-helvetica">
                      {predictionData.analysis}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-neutral-800 rounded-xl">
                <p className="font-medium mb-2 font-helvetica">
                  Predicted Likes Over 24 Hours
                </p>
                <div className="h-64">
                  <Line
                    data={{
                      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
                      datasets: [
                        {
                          data: predictionData.hourlyLikes.slice(
                            0,
                            visibleDataPoints
                          ),
                          borderColor: "#f97316",
                          backgroundColor: "rgba(249, 115, 22, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          )
        )}

        <div className="fixed bottom-4 left-0 right-0 text-center text-sm text-neutral-600">
          <a
            href="https://postpredictor.ai"
            target="_blank"
            className="hover:text-neutral-400 font-helvetica"
          >
            Predict your tech twitter tweet success with AI 📊
          </a>
        </div>
      </main>
    </div>
  );
}
