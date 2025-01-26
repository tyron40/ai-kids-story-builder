export function getTitle(story: any) {
  if (!story) {
    return "";
  }

  return story.story_cover?.title ?? story.title ?? story.story_title;
}
