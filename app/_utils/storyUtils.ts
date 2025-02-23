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
