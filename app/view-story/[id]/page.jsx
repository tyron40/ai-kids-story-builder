"use client"
import { db } from '@/config/db'
import { StoryData } from '@/config/schema'
import { eq } from 'drizzle-orm'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip';
import BookCoverPage from '../_components/BookCoverPage'
import StoryPages from '../_components/StoryPages'
import LastPage from '../_components/LastPage'
import { IoIosArrowDroprightCircle, IoIosArrowDropleftCircle } from "react-icons/io";
import { Image } from '@nextui-org/react'
import { getTitle } from '@/app/_utils/storyUtils'

function ViewStory({ params }) {
  const [story, setStory] = useState();
  const bookRef = useRef();
  const [count, setCount] = useState(0);

  const title = getTitle(story?.output)

  useEffect(() => {
    getStory();
  }, [])

  const getStory = async () => {
    const result = await db.select().from(StoryData)
      .where(eq(StoryData.storyId, params.id));
    setStory(result[0]);
  }

  const storyPages = useMemo(() => {
    const totalChapters = story?.output?.chapters?.length

    let pages = []

    if (totalChapters > 0) {
      pages = [...Array(totalChapters)].map((_, index) => {
        const chapter = story?.output.chapters[index]

        const image = chapter.chapter_image ? (
          <div key={`${index + 1}-img`} className="bg-white p-10 border">
            {chapter?.chapter_image && (
              <Image src={chapter?.chapter_image} />
            )}
          </div>
        ) : null;

        const content = <div key={index + 1} className='bg-white p-10 border'>
          <StoryPages storyChapter={story?.output.chapters[index]} />
        </div>

        return image ? [image, content] : content
      })
    }

    return pages.flat()
  }, [story])

  const bookPages = useMemo(() => {
    const totalChapters = story?.output?.chapters?.length

    if (totalChapters > 0) {
      return [
        <div key={0}>
          <BookCoverPage imageUrl={story?.coverImage} />
        </div>,
        ...storyPages,
        <div key={totalChapters + 1}>
          <LastPage story={story} />
        </div>
      ]
    }

    return []
  }, [story, storyPages])

  return (
    <div className='p-10 md:px-20 lg:px-40 flex justify-center  flex-col '>
      <h2 className='font-bold text-4xl text-center p-10 bg-primary text-white'>{title}</h2>
      <div className='relative'>
        {/* @ts-ignore */}
        <HTMLFlipBook width={500} height={500}
          showCover={true}
          className='mt-10'
          useMouseEvents={false}
          ref={bookRef}
        >
          {bookPages}
        </HTMLFlipBook>
        {count != 0 && <button className='absolute -left-5 top-[250px]'
          onClick={() => {
            bookRef.current.pageFlip().flipPrev();
            setCount(count - 1)
          }}
        >
          <IoIosArrowDropleftCircle className='text-[40px] text-primary cursor-pointer' />
        </button>}

        {count != (bookPages.length - 1) && <button className='absolute right-0 top-[250px]' onClick={() => {
          bookRef.current.pageFlip().flipNext();
          setCount(count + 1)
        }}>
          <IoIosArrowDroprightCircle className='text-[40px] text-primary cursor-pointer' />
        </button>}
      </div>
    </div>
  )
}

export default ViewStory