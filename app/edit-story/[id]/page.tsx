"use client"
import CustomLoader from "@/app/_components/CustomLoader"
import StoryPages from "@/app/_components/story/StoryPages"
import StoryCoverPage from "@/app/_components/story/StoryCoverPage"
import StoryLastPage from "@/app/_components/story/StoryLastPage"
import { generateImage } from "@/app/_utils/api"
import { getStory, StoryItem, updateStory } from "@/app/_utils/db"
import { Chapter } from "@/config/schema"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import StoryImage from "./_components/StoryImage"
import { getStoryCoverImagePrompt } from "@/app/_utils/storyUtils"
import Image from "next/image"
import ImageInput from "@/app/create-story/_components/ImageInput"
import { FieldData } from "@/app/create-story/_components/types"
import { Button } from "@nextui-org/button"
import { getImageData } from "@/app/_utils/imageUtils"
import { toast } from "react-toastify"

interface PageParams {
  id: string
}

export default function ViewStory({ params }: { params: PageParams }) {
  const [story, setStory] = useState<StoryItem | null>(null)
  const [seedData, setSeedData] = useState<FieldData | null>(null)
  const [loading, setLoading] = useState(true)
  const notify = (msg: string) => toast(msg)
  const notifyError = (msg: string) => toast.error(msg)

  const initStory = async () => {
    try {
      setLoading(true)
      const story = await getStory(params.id)
      setStory(story)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initStory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const regenerateCoverImage = useCallback(async () => {
    if (!story) {
      return
    }

    const prompt = getStoryCoverImagePrompt({
      story,
      gaiStory: story.output,
      seedImage: story.output.seedImageUrl,
    })

    const { imageUrl } = await generateImage({
      prompt,
      seedImage: story.output.seedImageUrl,
    })

    story.coverImage = imageUrl

    setStory({
      ...story,
    })

    await updateStory(story.id, { coverImage: imageUrl })
  }, [story])

  const regenerateChapterImage = useCallback(
    async (chapter: Chapter) => {
      if (!story) {
        return
      }

      const chapterIndex = story.output.chapters.findIndex(
        (x) => x.chapter_title === chapter.chapter_title
      )

      const { imageUrl } = await generateImage({
        prompt: chapter.image_prompt,
        seedImage: story.output.seedImageUrl,
      })

      story.output.chapters[chapterIndex].chapter_image = imageUrl

      setStory({
        ...story,
      })

      await updateStory(story.id, { output: story.output })
    },
    [story]
  )

  const regenerateAllImages = useCallback(async () => {
    if (!story) {
      return
    }

    try {
      setLoading(true)
      const seedImage = await getImageData(seedData!.fieldValue!)

      const prompt = getStoryCoverImagePrompt({
        story,
        gaiStory: story.output,
        seedImage,
      })

      const { imageUrl: coverImageUrl, seedImageUrl } = await generateImage({
        prompt,
        seedImage,
      })

      story.coverImage = coverImageUrl
      story.output.seedImageUrl = seedImageUrl

      // generate chapter images
      for (let index = 0; index < story.output.chapters.length; index++) {
        const chapter = story.output.chapters[index]
        if (chapter.image_prompt) {
          const { imageUrl } = await generateImage({
            prompt: chapter.image_prompt,
            seedImage: seedImageUrl,
          })
          story.output.chapters[index].chapter_image = imageUrl
        }
      }

      await updateStory(story.id, {
        output: story.output,
        coverImage: coverImageUrl,
      })

      setStory({ ...story })

      notify("Images regenerated successfully!")
    } catch (e) {
      console.error(e)
      notifyError("Failed to regenerate images, please try again.")
    } finally {
      setLoading(false)
    }
  }, [seedData, story])

  const onImageInputChange = (field: FieldData) => {
    setSeedData(field)
  }

  const storyPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length

    let pages: (React.JSX.Element | React.JSX.Element[])[] = []

    if (totalChapters > 0) {
      pages = [...Array(totalChapters)].map((_, index) => {
        const chapter = story.output.chapters[index]
        return [
          <div key={`${index + 1}-img`} className="bg-white p-4 border">
            <StoryImage
              chapter={chapter}
              regenerateImage={regenerateChapterImage}
            />
          </div>,
          <div key={index + 1} className="bg-white p-10 border w-[500px]">
            <StoryPages
              storyId={story.id}
              chapter={story.output.chapters[index]}
              chapterNumber={index}
            />
          </div>,
        ]
      })
    }

    return pages.flat()
  }, [story, regenerateChapterImage])

  const bookPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length

    if (totalChapters > 0) {
      return [
        <div key={0}>
          <StoryCoverPage
            imageUrl={story?.coverImage}
            className="bg-white p-4 "
            regenerateImage={regenerateCoverImage}
          />
        </div>,
        ...storyPages,
        <div key={totalChapters + 1}>
          <StoryLastPage story={story} />
        </div>,
      ]
    }

    return []
  }, [story, storyPages, regenerateCoverImage])

  const title = story?.output.story_cover.title ?? ""

  return (
    <>
      {!loading && (
        <div className="p-10 md:px-20 lg:px-40 flex flex-col gap-4 min-h-screen">
          <h2 className="font-bold text-4xl text-center p-10 bg-primary text-white">
            {title}
          </h2>
          <div className="flex flex-row justify-center gap-4">
            {story?.output.seedImageUrl && (
              <div className="flex flex-col gap-4">
                <span>Seed image:</span>
                <div className="relative w-[200px] h-[200px]">
                  <Image
                    src={story?.output.seedImageUrl}
                    fill
                    className="object-contain"
                    alt=""
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <ImageInput userSelection={onImageInputChange} />
              {seedData?.fieldValue && (
                <Button color="primary" onPress={regenerateAllImages}>
                  Regenerate all images
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 mt-10">
            {bookPages}
          </div>
        </div>
      )}
      <CustomLoader isLoading={loading} />
    </>
  )
}
