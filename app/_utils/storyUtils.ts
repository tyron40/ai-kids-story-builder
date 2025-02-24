import { GAIStoryData } from "@/config/GeminiAi"
import { StoryItem } from "./db"

interface StoryPromptParams {
  ageGroup: string
  storyType: string
  storySubject: string
  imageStyle: string
  totalChapters: number
}

export function getStoryPrompt(params: StoryPromptParams) {
  return (process.env.NEXT_PUBLIC_CREATE_STORY_PROMPT ?? "")
    .replace("{ageGroup}", params.ageGroup)
    .replace("{storyType}", params.storyType)
    .replace("{storySubject}", params.storySubject)
    .replace("{imageStyle}", params.imageStyle)
    .replace(
      "{totalChapters}",
      params.totalChapters ? params.totalChapters.toString() : "5"
    )
}

interface StoryCoverImagePromptParams {
  story: StoryItem
  gaiStory: GAIStoryData
  seedImage: string | null
}

export function getStoryCoverImagePrompt({
  story,
  gaiStory,
  seedImage,
}: StoryCoverImagePromptParams) {
  return seedImage
    ? `${story.storySubject ?? ""}, ${story.imageStyle}`
    : "Add text with title:" +
        gaiStory.story_cover.title +
        " in bold text for book cover, " +
        gaiStory.story_cover.image_prompt
}
