export function getTitle(story: any) {
  if (!story) {
    return "";
  }

  return story.story_cover?.title ?? story.title ?? story.story_title;
}

export function getChapterTitle(chapter: any) {
  if (!chapter) {
    return "";
  }

  return chapter?.title ?? chapter.chapter_title;
}
