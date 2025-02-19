"use client";
import { generateImage, saveImage } from "@/app/_utils/api";
import { getChapterTitle, getTitle } from "@/app/_utils/storyUtils";
import { db } from "@/config/db";
import { StoryData } from "@/config/schema";
import { Image } from "@nextui-org/react";
import { eq } from "drizzle-orm";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io";
import HTMLFlipBook from "react-pageflip";

import BookCoverPage from "../_components/BookCoverPage";
import StoryPages from "../_components/StoryPages";
import LastPage from "../_components/LastPage";
import { toBase64, urlToFile } from "@/app/_utils/imageUtils";
import { useUser } from "@clerk/nextjs";

function ViewStory({ params }) {
  const { user } = useUser();
  const [story, setStory] = useState();
  const bookRef = useRef();
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const title = getTitle(story?.output);

  useEffect(() => {
    getStory();
  }, []);

  const getStory = async () => {
    const result = await db
      .select()
      .from(StoryData)
      .where(eq(StoryData.storyId, params.id));
    setStory(result[0]);
    setTotalPages(result[0].output?.chapters?.length + 2);
  };

  const regenerateImage = async (chapter) => {
    if (!story?.output?.chapters) {
      return;
    }

    const chapterIndex = story.output.chapters.findIndex(
      (x) => getChapterTitle(x) === getChapterTitle(chapter)
    );

    const imageFile = await urlToFile(story.coverImage);
    const image = await toBase64(imageFile);

    const imageUrl = await generateImage(chapter.image_prompt, image);

    const savedImageUrl = await saveImage(imageUrl);

    story.output.chapters[chapterIndex].chapter_image = savedImageUrl;

    setStory({ ...story });

    await db
      .update(StoryData)
      .set({
        output: story.output,
      })
      .where(eq(StoryData.id, story.id));
  };

  const storyPages = useMemo(() => {
    const totalChapters = story?.output?.chapters?.length;
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    let pages = [];

    if (totalChapters > 0) {
      pages = [...Array(totalChapters)].map((_, index) => {
        const chapter = story?.output.chapters[index];

        const image = chapter.chapter_image ? (
          <div key={`${index + 1}-img`} className="bg-white p-10 border">
            {chapter?.chapter_image && <Image src={chapter?.chapter_image} />}
          </div>
        ) : null;

        const content = (
          <div key={index + 1} className="bg-white p-10 border">
          <StoryPages
            storyId={story?.id}
            chapter={story?.output.chapters[index]}
            chapterNumber={index}
              regenerateImage={
                userEmail && story?.userEmail === userEmail
                  ? regenerateImage
                  : null
              }
          />
        </div>
        );

        return image ? [image, content] : content;
      });
    }

    return pages.flat();
  }, [story, user]);

  const bookPages = useMemo(() => {
    const totalChapters = story?.output?.chapters?.length;

    if (totalChapters > 0) {
      return [
        <div key={0}>
          <BookCoverPage imageUrl={story?.coverImage} />
        </div>,
        ...storyPages,
        <div key={totalChapters + 1}>
          <LastPage story={story} />
        </div>,
      ];
    }

    return [];
  }, [story, storyPages]);

  const onFlip = () => {
    if (!bookRef.current) {
      return
    }

    const currentIndex = bookRef.current.pageFlip().getCurrentPageIndex()
    const totalPages = bookRef.current.pageFlip().getPageCount()

    setTotalPages(totalPages)
    setCount(currentIndex)
  }

  return (
    <div className='p-10 md:px-20 lg:px-40 flex flex-col min-h-screen'>
      <h2 className='font-bold text-4xl text-center p-10 bg-primary text-white'>{title}</h2>
      <div className='relative flex justify-center h-[500px] mt-10'>
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
        {count !== 0 && <button className='absolute left-0 top-[250px]'
          onClick={() => {
            bookRef.current.pageFlip().flipPrev();
          }}
        >
          <IoIosArrowDropleftCircle className='text-[40px] text-primary cursor-pointer' />
        </button>}

        {count < totalPages - 1 && <button className='absolute right-0 top-[250px]' onClick={() => {
          bookRef.current.pageFlip().flipNext();
        }}>
          <IoIosArrowDroprightCircle className='text-[40px] text-primary cursor-pointer' />
        </button>}
      </div>
    </div>
  )
}

export default ViewStory