import { Button } from "@nextui-org/button"
import Image from "next/image"
import { ForwardedRef, forwardRef } from "react"

import useRegenerateImage from "./useRegenerateImage"

interface StoryCoverPageProps {
  imageUrl: string
  className?: string
  regenerateImage?: () => Promise<void>
}

const StoryCoverPage = forwardRef(
  (
    { imageUrl, className, regenerateImage }: StoryCoverPageProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { onRegenerateImage, isLoading } = useRegenerateImage({
      regenerateImage: regenerateImage,
    })

    return (
      <div ref={ref} className={className}>
        <Image src={imageUrl} alt="cover" width={500} height={500} />
        {onRegenerateImage && (
          <Button
            color="primary"
            className="mt-3"
            onPress={onRegenerateImage}
            isLoading={isLoading}
          >
            Regenerate cover image
          </Button>
        )}
      </div>
    )
  }
)

StoryCoverPage.displayName = "StoryCoverPage"

export default StoryCoverPage
