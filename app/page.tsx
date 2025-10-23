"use client";
import { useState } from "react";
import DropZone from "./components/DropZone";
import { Squircle } from "@squircle-js/react";
import { AnimatePresence, motion } from "motion/react";

import {
  Check,
  Copy,
  Gauge,
  X,
  Upload,
  Command,
  CornerDownLeft,
  Plus,
  Undo,
  Redo,
  Download,
} from "lucide-react";
import { AnimatedCircularButton } from "./components/AnimatedButton";
import Image from "next/image";
import Spinner from "./components/Spinner";

interface HistoryItem {
  imageUrl: string;
  file: File;
}

export default function Home() {
  const [stage, setStage] = useState("initial");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  function handleClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    if (attachedImage !== null) {
      return;
    } else {
      input.click();
    }
  }

  async function handleFile(file: any) {
    console.log(file);
    const imageUrl = URL.createObjectURL(file);
    setAttachedImage(imageUrl);
    setOriginalImage(imageUrl);
    setCurrentFile(file);
    setStage("attached");
    setCopiedMessage(false);

    // Initialize history with the original image
    setImageHistory([{ imageUrl, file }]);
    setHistoryIndex(0);
  }

  async function processImage() {
    if (!currentFile || !prompt) return;

    setIsProcessing(true);
    setStage("processing");

    try {
      const formData = new FormData();
      formData.append("file", currentFile);
      formData.append("prompt", prompt);

      const response = await fetch(`/routes/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error processing image:", errorData);
        alert(`Error: ${errorData.error || "Failed to process image"}`);
        setIsProcessing(false);
        setStage("attached");
        return;
      }

      // Get the processed image as blob
      const blob = await response.blob();
      const processedImageUrl = URL.createObjectURL(blob);

      // Convert blob to File for next iteration
      const processedFile = new File([blob], "processed.jpg", {
        type: "image/jpeg",
      });

      // Update history: remove everything after current index, then add new image
      setImageHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [
          ...newHistory,
          { imageUrl: processedImageUrl, file: processedFile },
        ];
      });

      // Move to the new image (last in history)
      setHistoryIndex(historyIndex + 1);

      // Update the displayed image with the processed result
      setAttachedImage(processedImageUrl);
      setCurrentFile(processedFile);

      setPrompt("");
      setIsProcessing(false);
      setStage("attached");
    } catch (error) {
      console.error("Error processing image:", error);
      alert("An error occurred while processing the image");
      setIsProcessing(false);
      setStage("attached");
    }
  }

  function handleUndo() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousImage = imageHistory[newIndex];
      setHistoryIndex(newIndex);
      setAttachedImage(previousImage.imageUrl);
      setCurrentFile(previousImage.file);
    }
  }

  function handleRedo() {
    if (historyIndex < imageHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextImage = imageHistory[newIndex];
      setHistoryIndex(newIndex);
      setAttachedImage(nextImage.imageUrl);
      setCurrentFile(nextImage.file);
    }
  }

  async function downloadImage() {
    if (!attachedImage) return;

    try {
      // Fetch the image blob
      const response = await fetch(attachedImage);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }

  return (
    <div className="grid place-content-center h-dvh w-screen motion-opacity-in-0">
      <DropZone onClick={handleClick} onDropped={handleFile} stage={stage}>
        {(() => {
          if (isRateLimited) {
            return (
              <div className="p-8 flex flex-col items-center text-red-600 motion-preset-focus-sm">
                <Gauge size={18} className="mb-3" />
                <p className="text-sm font-jetbrains-mono">rate limited</p>
                <p className="text-[13px] opacity-60 font-jetbrains-mono mt-1">
                  try again tomorrow
                </p>
              </div>
            );
          } else {
            if (stage === "initial") {
              return (
                <div className="ml-12 mr-12 mt-4 mb-4 flex flex-col items-center gap-1 motion-opacity-in-0 py-4">
                  <div className="w-13 h-13 border border-gray-100 rounded-full grid place-content-center mb-5">
                    <Upload size={18} />
                  </div>
                  <p className="font-geist text-sm font-medium">
                    Drop an image here
                  </p>
                  <p className="opacity-60 font-jetbrains-mono text-sm">
                    Max size 100MB
                  </p>
                </div>
              );
            } else if (stage === "attached" || stage === "processing") {
              return (
                <div className="px-2 py-4 gap-2 flex flex-col motion-preset-focus-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex === 0 || isProcessing}
                      className={`transition-opacity duration-200 ${
                        historyIndex === 0 || isProcessing
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100 cursor-pointer hover:opacity-60"
                      }`}
                    >
                      <Undo
                        size={15}
                        strokeWidth={2.5}
                        className="text-gray-400"
                      />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={
                        historyIndex >= imageHistory.length - 1 || isProcessing
                      }
                      className={`transition-opacity duration-200 ${
                        historyIndex >= imageHistory.length - 1 || isProcessing
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100 cursor-pointer hover:opacity-60"
                      }`}
                    >
                      <Redo
                        size={15}
                        strokeWidth={2.5}
                        className="text-gray-400"
                      />
                    </button>
                  </div>
                  <div
                    className={`w-fit transition-all ${
                      stage === "processing" ? "dither-xs" : ""
                    } rounded-md duration-500 ${
                      stage === "processing" ? "" : ""
                    } relative group cursor-pointer`}
                    onClick={downloadImage}
                  >
                    <Image
                      src={attachedImage ?? ""}
                      alt="attached image"
                      width={400}
                      height={100}
                      className="rounded-md border border-black/15"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        setImageDimensions({
                          width: img.naturalWidth,
                          height: img.naturalHeight,
                        });
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/70 to-transparent rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between">
                      <p className="text-white text-sm font-mono tracking-wider font-medium pb-3 pl-3">
                        Download
                      </p>
                      <p className="text-white text-sm font-mono tracking-wider font-medium pb-3 pr-3">
                        {imageDimensions
                          ? `${imageDimensions.width} × ${imageDimensions.height}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {!isProcessing ? (
                          <motion.input
                            key="input"
                            type="text"
                            className="focus:outline-none font-medium pl-0.5 w-full"
                            placeholder="describe your edits"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.metaKey) {
                                processImage();
                              }
                            }}
                            initial={{
                              opacity: 0,
                              y: -10,
                              filter: "blur(4px)",
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                            }}
                            exit={{
                              opacity: 0,
                              y: 10,
                              filter: "blur(4px)",
                            }}
                            transition={{
                              duration: 0.2,
                            }}
                          />
                        ) : (
                          <motion.div
                            key="processing"
                            className="font-medium pl-0.5 text-gray-400"
                            initial={{
                              opacity: 0,
                              y: -10,
                              filter: "blur(4px)",
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                            }}
                            exit={{
                              opacity: 0,
                              y: 10,
                              filter: "blur(4px)",
                            }}
                            transition={{
                              duration: 0.2,
                            }}
                          >
                            processing
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {prompt !== "" && !isProcessing ? (
                        <motion.div
                          key="prompt"
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                            filter: "blur(2px)",
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: "blur(0px)",
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            filter: "blur(2px)",
                          }}
                        >
                          <Squircle
                            cornerRadius={6}
                            cornerSmoothing={1}
                            className="flex items-center gap-1 text-gray-500 text-sm border border-gray-100 px-1.5 py-1 mr-0.5"
                          >
                            <Command size={13} className="text-gray-500" />
                            <Plus
                              size={11}
                              strokeWidth={2.5}
                              className="text-gray-300"
                            />
                            <CornerDownLeft
                              size={13}
                              className="text-gray-500"
                            />
                          </Squircle>
                        </motion.div>
                      ) : isProcessing ? (
                        <motion.div
                          key="spinner"
                          className="mr-0.5"
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                            filter: "blur(2px)",
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: "blur(0px)",
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            filter: "blur(2px)",
                          }}
                        >
                          <Spinner size={13} className="text-gray-500" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              );
            } else if (stage === "done") {
              return (
                <div className="flex flex-col items-center">
                  <p className="font-geist text-[15px] max-w-md h-fit py-3 px-1">
                    {transcriptionText}
                  </p>
                </div>
              );
            } else {
              return null;
            }
          }
        })()}
      </DropZone>

      {copiedMessage ? (
        <div className="animate-copied-message-up flex gap-3 justify-center items-center mt-4">
          <div className="cursor-pointer bg-gray-100 rounded-full grid place-content-center text-gray-600">
            <AnimatedCircularButton
              ariaLabel="Copy to clipboard"
              onClick={() => {
                navigator.clipboard.writeText(transcriptionText);
                setTranscriptionText(transcriptionText);
              }}
              secondaryChildren={<Check size={14.45} strokeWidth={2.5} />}
            >
              <Copy
                size={14.45}
                strokeWidth={2.5}
                onClick={() => {
                  navigator.clipboard.writeText(transcriptionText);
                  setTranscriptionText(transcriptionText);
                }}
              />
            </AnimatedCircularButton>
          </div>
          <div className="cursor-pointer bg-gray-100 rounded-full grid place-content-center text-gray-600">
            <AnimatedCircularButton
              ariaLabel="Clear"
              onClick={() => {
                setStage("initial");
                setCopiedMessage(false);
                setTranscriptionText("");
              }}
              secondaryChildren={<X size={17} strokeWidth={2.5} />}
            >
              <X
                size={17}
                strokeWidth={2.5}
                onClick={() => {
                  setStage("initial");
                  setCopiedMessage(false);
                  setTranscriptionText("");
                }}
              />
            </AnimatedCircularButton>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
