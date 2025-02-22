"use client"
import { db } from "@/config/db"
import { StoryData } from "@/config/schema"
import { desc } from "drizzle-orm"
import React, { useEffect, useState } from "react"
import { StoryItemType } from "../dashboard/_components/UserStoryList"
import StoryItemCard from "../dashboard/_components/StoryItemCard"
import { Button } from "@nextui-org/button"
import CustomLoader from "../create-story/_components/CustomLoader"

const TOTAL_PER_PAGE = 8

export default function ExploreMore() {
  const [offset, setOffset] = useState(0)
  const [storyList, setStoryList] = useState<StoryItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  const fetchStories = () =>
    db
      .select()
      .from(StoryData)
      .orderBy(desc(StoryData.id))
      .limit(TOTAL_PER_PAGE)
      .offset(offset)

  useEffect(() => {
    let ignore = false

    fetchStories()
      .then((result: any) => {
        if (!ignore) {
          setStoryList(result)
          setOffset(offset + TOTAL_PER_PAGE)
          setHasMore(result.length > 0)
        }
      })
      .finally(() => setLoading(false))

    return () => {
      ignore = true
    }
  }, [])

  const loadMore = async () => {
    try {
      setLoading(true)
      const result: any = await db
        .select()
        .from(StoryData)
        .orderBy(desc(StoryData.id))
        .limit(TOTAL_PER_PAGE)
        .offset(offset)

      setStoryList((prev) => [...prev, ...result])
      setHasMore(result.length === TOTAL_PER_PAGE)
      setOffset(offset + TOTAL_PER_PAGE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-10 md:px-20 lg:px-40">
      <h2 className="font-bold text-4xl text-primary text-center">
        Explore More Stories
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-10 gap-10">
        {storyList.length > 0 &&
          storyList?.map((item) => (
            <StoryItemCard key={item.id} story={item} />
          ))}
      </div>
      {hasMore && (
        <div className="text-center mt-10">
          <Button className="" color="primary" onPress={loadMore}>
            Load More
          </Button>
        </div>
      )}
      <CustomLoader isLoading={loading} />
    </div>
  )
}
