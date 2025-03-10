import SkinColor from "@/app/create-story/_components/SkinColor"
import { GAIChapter } from "@/config/GeminiAi"
import ImageEditorControl from "./ImageEditorControl"
import StoryImage from "./StoryImage"
import { StoryItem } from "@/app/_utils/db"
import { Chapter } from "@/config/schema"
import { useCallback, useState } from "react"
import { FieldData } from "@/app/create-story/_components/types"

interface ChapterEditorProps {
  story: StoryItem
  chapter: GAIChapter
  regenerateImage: (
    chapter: Chapter,
    image?: File | string,
    skinColor?: string
  ) => Promise<void>
}

export default function ChapterEditor({
  story,
  chapter,
  regenerateImage,
}: ChapterEditorProps) {
  const [skinColor, setSkinColor] = useState<string>()

  const onSkinColorChange = useCallback((field: FieldData) => {
    setSkinColor(field.fieldValue as string)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-start">
      <StoryImage chapter={chapter} width={300} height={300} />
      <div className="flex flex-col gap-4">
        <span className="font-bold text-4xl text-primary">1. Edit image</span>
        <ImageEditorControl
          story={story}
          onRegenerate={async (newImage?: File | string) =>
            regenerateImage(chapter, newImage, skinColor)
          }
        />
        <SkinColor userSelection={onSkinColorChange} />
      </div>
    </div>
  )
}
