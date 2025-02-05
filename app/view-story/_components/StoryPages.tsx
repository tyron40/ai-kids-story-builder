import { Button } from "@nextui-org/button";
import axios from "axios";
import React, { useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { MdPlayCircleFilled } from "react-icons/md";
import { toast } from "react-toastify";

const StoryPages = React.forwardRef((props: any, ref: any) => {
  const { storyId, chapter, chapterNumber, regenerateImage } = props;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] =
    useState<boolean>(false);
  const notify = (msg: string) => toast(msg);
  const notifyError = (msg: string) => toast.error(msg);

  const playSpeech = async () => {
    if (isAudioLoading) {
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      return;
    }

    try {
      setIsAudioLoading(true);
      const response = await axios.post("/api/generate-speech", {
        storyId,
        chapter: chapterNumber,
        text: chapter.chapter_text,
      });

      setAudioUrl(response?.data?.audioUrl);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const onRegenerateImage = async () => {
    if (isRegeneratingImage) {
      return;
    }

    try {
      setIsRegeneratingImage(true);
      await regenerateImage(chapter);
      notify("Chapter image updated");
    } catch (error) {
      console.error(error);
      notifyError("Something went wrong, please try again.");
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl fontbold text-primary flex justify-between">
        {chapter?.chapter_title}
        <button className="text-3xl cursor-pointer" onClick={playSpeech}>
          {isAudioLoading ? (
            <AiOutlineLoading
              className="animate-spin
"
            />
          ) : (
            <MdPlayCircleFilled />
          )}
        </button>
      </h2>
      {audioUrl && (
        <audio controls autoPlay ref={audioRef} src={audioUrl}>
          <source src={audioUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      )}
      <p className="text-lg p-10 mt-3 rounded-lg bg-slate-100 line-clamp-[10]">
        {chapter?.chapter_text}
      </p>
      {regenerateImage && (
        <Button
          color="primary"
          className="mt-3"
          onPress={onRegenerateImage}
          isLoading={isRegeneratingImage}
        >
          Regenerate image
        </Button>
      )}
    </div>
  );
});

export default StoryPages;
