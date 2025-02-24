"use client"
import { useUser } from "@clerk/nextjs"
import { chatSession, isStoryData } from "@/config/GeminiAi"
import { db } from "@/config/db"
import { Users } from "@/config/schema"
import { Button } from "@nextui-org/button"
import { eq } from "drizzle-orm"
import { useRouter } from "next/navigation"
import { useContext, useState } from "react"
import { toast } from "react-toastify"
import { v4 as uuidv4 } from "uuid"

import { UserDetailContext } from "../_context/UserDetailConext"
import { generateImage, saveImage } from "../_utils/api"
import { toBase64 } from "../_utils/imageUtils"
import AgeGroup from "./_components/AgeGroup"
import CustomLoader from "../_components/CustomLoader"
import ImageInput from "./_components/ImageInput"
import ImageStyle from "./_components/ImageStyle"
import StorySubjectInput from "./_components/StorySubjectInput"
import StoryType from "./_components/StoryType"
import TotalChaptersSelect from "./_components/TotalChaptersSelect"
import { getStoryPrompt } from "../_utils/storyUtils"
import { createStory } from "../_utils/db"
import { FormDataType, UserSelectionHandler } from "./_components/types"

async function getImageData(storyImage: File | string) {
  if (typeof storyImage === "object") {
    return (await toBase64(storyImage)) as string
  }

  return storyImage
}

const defaultFormData: FormDataType = {
  storySubject: "",
  storyImage: null,
  storyType: "",
  imageStyle: "",
  ageGroup: "",
  totalChapters: 5,
}

export default function CreateStory() {
  const router = useRouter()
  const { user } = useUser()
  const { userDetail } = useContext(UserDetailContext)
  const [formData, setFormData] = useState(defaultFormData)
  const [loading, setLoading] = useState(false)

  const notify = (msg: string) => toast(msg)
  const notifyError = (msg: string) => toast.error(msg)

  const onHandleUserSelection: UserSelectionHandler = (data) => {
    setFormData((prev) => ({
      ...prev,
      [data.fieldName]: data.fieldValue,
    }))
    console.log(formData)
  }

  const saveStory = async (output: string, imageUrl: string) => {
    const recordId = uuidv4()
    return createStory({
      storyId: recordId,
      ageGroup: formData?.ageGroup,
      imageStyle: formData?.imageStyle,
      storySubject: formData?.storySubject,
      storyType: formData?.storyType,
      output: JSON.parse(output),
      coverImage: imageUrl,
      userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
      userImage: user?.imageUrl ?? null,
      userName: user?.username ?? null,
    })
  }

  const updateUserCredits = async () => {
    await db
      .update(Users)
      .set({
        credit: Number(userDetail!.credit! - 1),
      })
      .where(eq(Users.userEmail, user?.primaryEmailAddress?.emailAddress ?? ""))
      .returning({ id: Users.id })
  }

  const onGenerateImage = async (
    prompt: string,
    image: string | null
  ): Promise<string> => {
    const generatedImageUrl = await generateImage(prompt, image as string)
    return await saveImage(generatedImageUrl)
  }

  const onGenerateStoryData = async () => {
    const storyPrompt = getStoryPrompt(formData)
    const result = await chatSession.sendMessage(storyPrompt)

    const story = JSON.parse(
      result?.response.text().replace(/(})(,?)(\n *\})/g, "$1,")
    )

    if (!isStoryData(story)) {
      throw new Error("Generated data is invalid")
    }

    return story
  }

  const onGenerateStory = async () => {
    if (userDetail!.credit! <= 0) {
      notifyError("You dont have enough credits!")
      return
    }

    try {
      setLoading(true)

      const story = await onGenerateStoryData()

      const image =
        formData.storyImage !== null
          ? await getImageData(formData.storyImage)
          : null

      const coverImagePrompt = image
        ? `${formData?.storySubject ?? ""}, ${formData?.imageStyle}`
        : "Add text with title:" +
          story?.story_cover?.title +
          " in bold text for book cover, " +
          story?.story_cover?.image_prompt

      const coverImageUrl = await onGenerateImage(
        coverImagePrompt,
        image as string
      )

      // generate chapter images
      for (let index = 0; index < story.chapters.length; index++) {
        const chapter = story.chapters[index]
        if (chapter.image_prompt) {
          const chapterImageUrl = await onGenerateImage(
            chapter.image_prompt,
            image as string
          )
          story.chapters[index].chapter_image = chapterImageUrl
        }
      }

      const created = await saveStory(JSON.stringify(story), coverImageUrl)

      notify("Story generated")
      await updateUserCredits()
      router?.replace("/view-story/" + created[0].storyId)
    } catch (e) {
      console.log(e)
      notifyError("Something went wrong, please try again!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-10 md:px-20 lg:px-40">
      <h2 className="font-extrabold text-[70px] text-primary text-center">
        CREATE YOUR STORY
      </h2>
      <p className="text-2xl text-primary text-center">
        Unlock your creativity with AI: Craft stories like never before!Let our
        AI bring your imagination to life, one story at a time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14">
        <div className="grid grid-cols-2 gap-2">
          <StorySubjectInput userSelection={onHandleUserSelection} />
          <ImageInput userSelection={onHandleUserSelection} />
        </div>
        <StoryType userSelection={onHandleUserSelection} />
        <AgeGroup userSelection={onHandleUserSelection} />
        <ImageStyle userSelection={onHandleUserSelection} />
        <TotalChaptersSelect userSelection={onHandleUserSelection} />
      </div>

      <div className="flex justify-end my-10 flex-col items-end">
        <Button
          color="primary"
          disabled={loading}
          className="p-8 text-2xl"
          onPress={onGenerateStory}
        >
          Generate Story
        </Button>
        <span className="mt-2">1 Credit will be used</span>
      </div>
      <CustomLoader isLoading={loading} />
    </div>
  )
}
