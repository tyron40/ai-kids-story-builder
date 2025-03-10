import StoryCoverPage from "@/app/_components/story/StoryCoverPage"
import ImageEditorControl from "./ImageEditorControl"
import SkinColor from "@/app/create-story/_components/SkinColor"
import { useCallback, useState } from "react"
import { FieldData } from "@/app/create-story/_components/types"
import { StoryItem } from "@/app/_utils/db"

interface CoverImageEditorProps {
  story: StoryItem
  regenerateImage: (image?: File | string, skinColor?: string) => Promise<void>
}

export default function CoverImageEditor({
  story,
  regenerateImage,
}: CoverImageEditorProps) {
  const [skinColor, setSkinColor] = useState<string | undefined>()

  const onSkinColorChange = useCallback((field: FieldData) => {
    setSkinColor(field.fieldValue as string)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-start">
      <StoryCoverPage
        imageUrl={story?.coverImage}
        width={300}
        height={300}
        className="rounded-2xl overflow-hidden"
      />
      <div className="flex flex-col gap-4">
        <span className="font-bold text-4xl text-primary">1. Edit image</span>
        <ImageEditorControl
          story={story}
          onRegenerate={async (newImage?: File | string) =>
            regenerateImage(newImage, skinColor)
          }
        />
        <SkinColor userSelection={onSkinColorChange} />
      </div>
    </div>
  )
}
