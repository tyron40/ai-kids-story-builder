"use client"
import React, { useContext, useState } from "react"
import StorySubjectInput from "./_components/StorySubjectInput"
import StoryType from "./_components/StoryType"
import AgeGroup from "./_components/AgeGroup"
import ImageStyle from "./_components/ImageStyle"
import { Button } from "@nextui-org/button"
import { chatSession } from "@/config/GeminiAi"
import { db } from "@/config/db"
import { StoryData, Users } from "@/config/schema"
//@ts-ignore
import uuid4 from "uuid4"
import CustomLoader from "./_components/CustomLoader"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useUser } from "@clerk/nextjs"
import { UserDetailContext } from "../_context/UserDetailConext"
import { eq } from "drizzle-orm"
import TotalChaptersSelect from "./_components/TotalChaptersSelect"
import ImageInput from "./_components/ImageInput"
import { toBase64 } from "../_utils/imageUtils"
import { generateImage, saveImage } from "../_utils/api"

const CREATE_STORY_PROMPT = process.env.NEXT_PUBLIC_CREATE_STORY_PROMPT
export interface FieldData {
  fieldName: string
  fieldValue: string
}

export interface FormDataType {
  storySubject: string
  storyImage: File | string
  storyType: string
  imageStyle: string
  ageGroup: string
  totalChapters: number
}

export default function CreateStory() {
  const [formData, setFormData] = useState<FormDataType>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const notify = (msg: string) => toast(msg)
  const notifyError = (msg: string) => toast.error(msg)
  const { user } = useUser()
  const { userDetail } = useContext(UserDetailContext)

  /**
   * used to add data to form
   * @param data
   */
  const onHandleUserSelection = (data: FieldData) => {
    setFormData((prev: any) => ({
      ...prev,
      [data.fieldName]: data.fieldValue,
    }))
    console.log(formData)
  }

  const GenerateStory = async () => {
    if (userDetail.credit <= 0) {
      notifyError("You dont have enough credits!")
      return
    }

    setLoading(true)

    const FINAL_PROMPT = CREATE_STORY_PROMPT?.replace(
      "{ageGroup}",
      formData?.ageGroup ?? ""
    )
      .replace("{storyType}", formData?.storyType ?? "")
      .replace("{storySubject}", formData?.storySubject ?? "")
      .replace("{imageStyle}", formData?.imageStyle ?? "")
      .replace(
        "{totalChapters}",
        formData?.totalChapters ? formData.totalChapters.toString() : "4"
      )

    //Generate AI Story

    try {
      const result = await chatSession.sendMessage(FINAL_PROMPT)
      const story = JSON.parse(
        result?.response.text().replace(/(})(,?)(\n *\})/g, "$1,")
      )

      // const jsonString=result?.response.text().replace(/":\s*"(.*?)"/g, '": "$1",')   // Adds comma after string values
      // .replace(/":\s*(\d+)(?=\s*)/g, '": $1,') // Adds comma after numeric values
      // .replace(/,\s*}/g, ' }'); // Removes the last comma before closing brace
      // const story=JSON.parse(jsonString)

      //Generate Image

      let image = null

      if (formData?.storyImage && typeof formData.storyImage === "string") {
        image = formData.storyImage
      }

      if (formData?.storyImage && typeof formData.storyImage === "object") {
        image = (await toBase64(formData?.storyImage)) as string
      }

      const prompt = image
        ? `${formData?.storySubject ?? ""}, ${formData?.imageStyle}`
        : "Add text with  title:" +
          story?.story_cover?.title +
          " in bold text for book cover, " +
          story?.story_cover?.image_prompt

      const coverImageUrl = await generateImage(prompt, image as string)
      const imageResult = await saveImage(coverImageUrl)

      const FirebaseStorageImageUrl = imageResult.data.imageUrl

      for (let index = 0; index < story.chapters.length; index++) {
        const chapter = story.chapters[index]
        if (chapter.image_prompt) {
          const imageUrl = await generateImage(
            chapter.image_prompt,
            image as string
          )
          const imageResult = await saveImage(imageUrl)
          story.chapters[index].chapter_image = imageResult.data.imageUrl
        }
      }

      const resp: any = await SaveInDB(
        JSON.stringify(story),
        FirebaseStorageImageUrl
      )

      notify("Story generated")
      await UpdateUserCredits()

      router?.replace("/view-story/" + resp[0].storyId)
    } catch (e) {
      console.log(e)
      notifyError("Server Error, Try again")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save Data in Database
   * @param output AI Output
   * @returns
   */
  const SaveInDB = async (output: string, imageUrl: string) => {
    const recordId = uuid4()
    setLoading(true)
    try {
      const result = await db
        .insert(StoryData)
        .values({
          storyId: recordId,
          ageGroup: formData?.ageGroup,
          imageStyle: formData?.imageStyle,
          storySubject: formData?.storySubject,
          storyType: formData?.storyType,
          output: JSON.parse(output),
          coverImage: imageUrl,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          userImage: user?.imageUrl,
          userName: user?.fullName,
        })
        .returning({ storyId: StoryData?.storyId })
      setLoading(false)
      return result
    } catch (e) {
      setLoading(false)
    }
  }

  const UpdateUserCredits = async () => {
    await db
      .update(Users)
      .set({
        credit: Number(userDetail?.credit - 1),
      })
      .where(eq(Users.userEmail, user?.primaryEmailAddress?.emailAddress ?? ""))
      .returning({ id: Users.id })
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
          className="p-10 text-2xl"
          onPress={GenerateStory}
        >
          Generate Story
        </Button>
        <span>1 Credit will be used</span>
      </div>
      <CustomLoader isLoading={loading} />
    </div>
  )
}
