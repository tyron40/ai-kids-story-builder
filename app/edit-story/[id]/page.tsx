"use client"
import CustomLoader from "@/app/_components/CustomLoader"
import StoryPages from "@/app/_components/story/StoryPages"
import StoryCoverPage from "@/app/_components/story/StoryCoverPage"
import StoryLastPage from "@/app/_components/story/StoryLastPage"
import { generateImage, saveImage } from "@/app/_utils/api"
import { getStory, StoryItem, updateStory } from "@/app/_utils/db"
import { toBase64, urlToFile } from "@/app/_utils/imageUtils"
import { Chapter } from "@/config/schema"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import StoryImage from "./_components/StoryImage"
import { getStoryCoverImagePrompt } from "@/app/_utils/storyUtils"

interface PageParams {
  id: string
}

export default function ViewStory({ params }: { params: PageParams }) {
  const [story, setStory] = useState<StoryItem | null>(null)
  const [loading, setLoading] = useState(true)

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

    const imageFile = await urlToFile(story.coverImage)
    const image = await toBase64(imageFile)

    const prompt = getStoryCoverImagePrompt({
      story,
      gaiStory: story.output,
      seedImage: image as string,
    })

    const imageUrl = await generateImage(prompt, image as string)
    const savedImageUrl = await saveImage(imageUrl)

    story.coverImage = savedImageUrl

    setStory({
      ...story,
    })

    await updateStory(story.id, { coverImage: savedImageUrl })
  }, [story])

  const regenerateChapterImage = useCallback(
    async (chapter: Chapter) => {
      if (!story) {
        return
      }

      const chapterIndex = story.output.chapters.findIndex(
        (x) => x.chapter_title === chapter.chapter_title
      )

      const imageFile = await urlToFile(story.coverImage)
      const image = await toBase64(imageFile)

      const imageUrl = await generateImage(
        chapter.image_prompt,
        image as string
      )

      const savedImageUrl = await saveImage(imageUrl)

      story.output.chapters[chapterIndex].chapter_image = savedImageUrl

      setStory({
        ...story,
      })

      await updateStory(story.id, { output: story.output })
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
  }, [regenerateChapterImage, story])

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
    <div className="p-10 md:px-20 lg:px-40 flex flex-col min-h-screen">
      {!loading && (
        <h2 className="font-bold text-4xl text-center p-10 bg-primary text-white">
          {title}
        </h2>
      )}
      <div className="flex flex-col justify-center items-center gap-4 mt-10">
        {bookPages}
      </div>
      <CustomLoader isLoading={loading} />
    </div>
  )
}
