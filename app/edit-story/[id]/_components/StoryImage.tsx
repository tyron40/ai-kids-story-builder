import useRegenerateImage from "@/app/_components/story/useRegenerateImage"
import { Chapter } from "@/config/schema"
import { Button } from "@nextui-org/button"
import Image from "next/image"

interface StoryImageProps {
  chapter: Chapter
  regenerateImage?: (chapter: Chapter) => Promise<void>
}

export default function StoryImage({
  chapter,
  regenerateImage,
}: StoryImageProps) {
  const { onRegenerateImage, isLoading } = useRegenerateImage({
    regenerateImage: regenerateImage
      ? () => regenerateImage(chapter)
      : undefined,
  })

  return (
    <>
      <Image
        src={chapter.chapter_image}
        width={500}
        height={500}
        alt={chapter.image_prompt}
      />
      {onRegenerateImage && (
        <Button
          color="primary"
          className="mt-3"
          onPress={onRegenerateImage}
          isLoading={isLoading}
        >
          Regenerate chapter image
        </Button>
      )}
    </>
  )
}
