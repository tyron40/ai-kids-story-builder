"use client"
import { generateImage, saveImage } from "@/app/_utils/api"
import { Image } from "@nextui-org/react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io"
import HTMLFlipBook from "react-pageflip"

import BookCoverPage from "../_components/BookCoverPage"
import StoryPages from "../_components/StoryPages"
import LastPage from "../_components/LastPage"
import { toBase64, urlToFile } from "@/app/_utils/imageUtils"
import { useUser } from "@clerk/nextjs"
import { getStory, StoryItem, updateStory } from "@/app/_utils/db"
import { Chapter } from "@/config/schema"
import CustomLoader from "@/app/create-story/_components/CustomLoader"

interface PageFlipRef {
  pageFlip: () => {
    getCurrentPageIndex: () => number
    getPageCount: () => number
    flipPrev: () => void
    flipNext: () => void
  }
}

interface PageParams {
  id: string
}

export default function ViewStory({ params }: { params: PageParams }) {
  const { user } = useUser()
  const [story, setStory] = useState<StoryItem | null>(null)
  const bookRef = useRef<PageFlipRef>(null)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const initStory = async () => {
    try {
      setLoading(true)
      const story = await getStory(params.id)
      setStory(story)
      setTotalPages(story.output.chapters.length + 2)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initStory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const regenerateImage = useCallback(
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

      await updateStory(story.id, story.output)
    },
    [story]
  )

  const storyPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length
    const userEmail = user?.primaryEmailAddress?.emailAddress

    let pages: (React.JSX.Element | React.JSX.Element[])[] = []

    if (totalChapters > 0) {
      pages = [...Array(totalChapters)].map((_, index) => {
        const chapter = story.output.chapters[index]

        const image = chapter.chapter_image ? (
          <div key={`${index + 1}-img`} className="bg-white p-10 border">
            {chapter?.chapter_image && (
              <Image src={chapter?.chapter_image} alt="" />
            )}
          </div>
        ) : null

        const content = (
          <div key={index + 1} className="bg-white p-10 border">
            <StoryPages
              storyId={story.id}
              chapter={story.output.chapters[index]}
              chapterNumber={index}
              regenerateImage={
                userEmail && story?.userEmail === userEmail && story
                  ? regenerateImage
                  : null
              }
            />
          </div>
        )

        return image ? [image, content] : content
      })
    }

    return pages.flat()
  }, [regenerateImage, story, user?.primaryEmailAddress?.emailAddress])

  const bookPages = useMemo(() => {
    if (!story) {
      return []
    }

    const totalChapters = story.output.chapters.length

    if (totalChapters > 0) {
      return [
        <div key={0}>
          <BookCoverPage imageUrl={story?.coverImage} />
        </div>,
        ...storyPages,
        <div key={totalChapters + 1}>
          <LastPage story={story} />
        </div>,
      ]
    }

    return []
  }, [story, storyPages])

  const onFlip = () => {
    if (!bookRef.current) {
      return
    }

    const currentIndex = bookRef.current.pageFlip().getCurrentPageIndex()
    const totalPages = bookRef.current.pageFlip().getPageCount()

    setTotalPages(totalPages)
    setCount(currentIndex)
  }

  const title = story?.output.story_cover.title ?? ""

  return (
    <div className="p-10 md:px-20 lg:px-40 flex flex-col min-h-screen">
      <h2 className="font-bold text-4xl text-center p-10 bg-primary text-white">
        {title}
      </h2>
      <div className="relative flex justify-center h-[500px] mt-10">
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <HTMLFlipBook
          size="stretch"
          width={500}
          minWidth={500}
          maxWidth={500}
          height={500}
          minHeight={500}
          maxHeight={500}
          showCover={true}
          useMouseEvents={false}
          ref={bookRef}
          onFlip={onFlip}
        >
          {bookPages}
        </HTMLFlipBook>
        {count !== 0 && (
          <button
            className="absolute left-0 top-[250px]"
            onClick={() => {
              bookRef.current?.pageFlip().flipPrev()
            }}
          >
            <IoIosArrowDropleftCircle className="text-[40px] text-primary cursor-pointer" />
          </button>
        )}

        {count < totalPages - 1 && (
          <button
            className="absolute right-0 top-[250px]"
            onClick={() => {
              bookRef.current?.pageFlip().flipNext()
            }}
          >
            <IoIosArrowDroprightCircle className="text-[40px] text-primary cursor-pointer" />
          </button>
        )}
      </div>
      <CustomLoader isLoading={loading} />
    </div>
  )
}
