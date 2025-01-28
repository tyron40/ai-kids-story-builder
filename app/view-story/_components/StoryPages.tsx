import axios from "axios";
import React, { useRef, useState } from "react";
import { MdPlayCircleFilled } from "react-icons/md";
import { AiOutlineLoading } from "react-icons/ai";

const StoryPages = React.forwardRef((props: any, ref: any) => {
  const { storyId, chapter, chapterNumber } = props;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSpeech = async () => {
    if (isLoading) {
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/api/generate-speech", {
        storyId,
        chapter: chapterNumber,
        text: chapter.chapter_text,
      });

      setAudioUrl(response?.data?.audioUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl fontbold text-primary flex justify-between">
        {chapter?.chapter_title}
        <button className="text-3xl cursor-pointer" onClick={playSpeech}>
          {isLoading ? (
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
    </div>
  );
});

export default StoryPages;
