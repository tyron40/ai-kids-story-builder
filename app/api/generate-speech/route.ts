import { storage } from "@/config/firebaseConfig"
import axios from "axios"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"

async function readWavFile(url: string) {
  const response = await axios.get(url, { responseType: "arraybuffer" })
  return response.data
}

export async function POST(req: NextRequest) {
  const { storyId, chapter, text } = await req.json()

  const filename = `${storyId}_${chapter}.wav`

  const audioRef = ref(storage, filename)

  let url: string | null = null

  try {
    url = await getDownloadURL(audioRef)
  } catch {}

  if (url) {
    return NextResponse.json({ audioUrl: url })
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  })

  const input = {
    text,
  }

  const output = (await replicate.run(
    "jaaari/kokoro-82m:dfdf537ba482b029e0a761699e6f55e9162cfd159270bfe0e44857caa5f275a6",
    { input }
  )) as unknown as string

  const data = await readWavFile(output)

  await uploadBytes(audioRef, new Uint8Array(data), {
    contentType: "audio/wav",
  })

  url = await getDownloadURL(audioRef)

  return NextResponse.json({ audioUrl: url })
}
