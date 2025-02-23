import { generateSpeech } from "@/app/_utils/api"
import { Chapter } from "@/config/schema"
import { Button } from "@nextui-org/button"
import { ForwardedRef, forwardRef, useRef, useState } from "react"
import { AiOutlineLoading } from "react-icons/ai"
import { MdPlayCircleFilled } from "react-icons/md"
import { toast } from "react-toastify"

interface StoryPagesProps {
  storyId: number
  chapter: Chapter
  chapterNumber: number
  regenerateImage: ((chapter: Chapter) => Promise<void>) | null
}

const StoryPages = forwardRef(
  (props: StoryPagesProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { storyId, chapter, chapterNumber, regenerateImage } = props
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isAudioLoading, setIsAudioLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isRegeneratingImage, setIsRegeneratingImage] = useState(false)
    const notify = (msg: string) => toast(msg)
    const notifyError = (msg: string) => toast.error(msg)

    const playSpeech = async () => {
      if (isAudioLoading) {
        return
      }

      if (audioUrl) {
        audioRef.current?.play()
        return
      }

      try {
        setIsAudioLoading(true)

        const audioUrl = await generateSpeech(
          storyId,
          chapterNumber,
          chapter.chapter_text
        )

        setAudioUrl(audioUrl)
      } finally {
        setIsAudioLoading(false)
      }
    }

    const onRegenerateImage = async () => {
      if (isRegeneratingImage) {
        return
      }

      try {
        setIsRegeneratingImage(true)
        await regenerateImage!(chapter)
        notify("Chapter image updated")
      } catch (e) {
        console.error(e)
        notifyError("Something went wrong, please try again.")
      } finally {
        setIsRegeneratingImage(false)
      }
    }

    return (
      <div ref={ref}>
        <h2 className="text-2xl fontbold text-primary flex justify-between">
          {chapter.chapter_title}
          <button className="text-3xl cursor-pointer" onClick={playSpeech}>
            {isAudioLoading ? (
              <AiOutlineLoading className="animate-spin" />
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
          {chapter.chapter_text}
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
    )
  }
)

StoryPages.displayName = "StoryPages"

export default StoryPages
