"use client"
import CustomLoader from "@/app/_components/CustomLoader"
import StoryPages from "@/app/_components/story/StoryPages"
import StoryCoverPage from "@/app/_components/story/StoryCoverPage"
import StoryLastPage from "@/app/_components/story/StoryLastPage"
import { generateImage } from "@/app/_utils/api"
import { getStory, StoryItem, updateStory } from "@/app/_utils/db"
import { getImageData } from "@/app/_utils/imageUtils"
import { getStoryCoverImagePrompt } from "@/app/_utils/storyUtils"
import { Chapter } from "@/config/schema"
import { Divider } from "@nextui-org/react"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import ImageEditorControl from "./_components/ImageEditorControl"
import StoryImage from "./_components/StoryImage"

interface PageParams {
  id: string
}

export default function ViewStory({ params }: { params: PageParams }) {
  const [story, setStory] = useState<StoryItem | null>(null)
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

  const regenerateCoverImage = useCallback(
    async (seedImage?: File | string) => {
      if (!story) {
        return
      }

      try {
        if (seedImage) {
          seedImage = await getImageData(seedImage)
        }

        const prompt = getStoryCoverImagePrompt({
          story,
          gaiStory: story.output,
          seedImage: story.output.seedImageUrl,
        })

        const { imageUrl } = await generateImage({
          prompt,
          seedImage: seedImage ?? story.output.seedImageUrl,
        })

        story.coverImage = imageUrl

        setStory({
          ...story,
        })
        await updateStory(story.id, { coverImage: imageUrl })

        notify("Cover image regenerated successfully!")
      } catch (e) {
        console.error(e)
        notifyError("Failed to regenerate cover image, please try again.")
      }
    },
    [story]
  )

  const regenerateChapterImage = useCallback(
    async (chapter: Chapter, seedImage?: File | string) => {
      if (!story) {
        return
      }

      try {
        const chapterIndex = story.output.chapters.findIndex(
          (x) => x.chapter_title === chapter.chapter_title
        )

        if (seedImage) {
          seedImage = await getImageData(seedImage)
        }

        const { imageUrl } = await generateImage({
          prompt: chapter.image_prompt,
          seedImage: seedImage ?? story.output.seedImageUrl,
        })

        story.output.chapters[chapterIndex].chapter_image = imageUrl

        setStory({
          ...story,
        })

        await updateStory(story.id, { output: story.output })

        notify("Chapter image regenerated successfully!")
      } catch (e) {
        console.error(e)
        notifyError("Failed to regenerate chapter image, please try again.")
      }
    },
    [story]
  )

  const regenerateAllImages = useCallback(
    async (seedImage?: File | string) => {
      if (!story) {
        return
      }

      try {
        setLoading(true)

        if (seedImage) {
          seedImage = await getImageData(seedImage)
        }

        const prompt = getStoryCoverImagePrompt({
          story,
          gaiStory: story.output,
          seedImage: seedImage ?? story.output.seedImageUrl,
        })

        const { imageUrl: coverImageUrl, seedImageUrl } = await generateImage({
          prompt,
          seedImage: seedImage ?? story.output.seedImageUrl,
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
    },
    [story]
  )

  const storyPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length

    let pages: (React.JSX.Element | React.JSX.Element[])[] = []

    if (totalChapters > 0) {
      pages = [...Array(totalChapters)].map((_, index) => {
        const chapter = story.output.chapters[index]
        return (
          <div
            key={`chapter-${index + 1}-img`}
            className="flex flex-col gap-2 bg-white p-4 max-w-screen-md"
          >
            <span className="fs-3">Chapter {index + 1}</span>
            <div className="flex flex-col lg:flex-row gap-2 items-center">
              <StoryImage chapter={chapter} width={300} height={300} />
              <ImageEditorControl
                story={story}
                onRegenerate={async (newImage?: File | string) =>
                  regenerateChapterImage(chapter, newImage)
                }
              />
            </div>
            <Divider />
            <StoryPages
              storyId={story.id}
              chapter={story.output.chapters[index]}
              chapterNumber={index}
            />
          </div>
        )
      })
    }

    return pages
  }, [story, regenerateChapterImage])

  const bookPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length

    if (totalChapters > 0) {
      return [
        <div
          key={0}
          className="flex flex-col gap-2 bg-white p-4 max-w-screen-md"
        >
          <span className="fs-3">Cover image</span>
          <div className="flex flex-col lg:flex-row gap-2 items-center">
            <StoryCoverPage
              imageUrl={story?.coverImage}
              width={300}
              height={300}
              className="rounded-2xl overflow-hidden"
            />
            <ImageEditorControl
              story={story}
              onRegenerate={async (newImage?: File | string) =>
                regenerateCoverImage(newImage)
              }
            />
          </div>
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
          {story && (
            <ImageEditorControl
              story={story}
              onRegenerate={regenerateAllImages}
              generateTxt="Regenerate all images"
            />
          )}
          <div className="flex flex-col justify-center items-center gap-4 mt-10">
            {bookPages}
          </div>
        </div>
      )}
      <CustomLoader isLoading={loading} />
    </>
  )
}
