import { storage } from "@/config/firebaseConfig";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: NextRequest) {
  const { storyId, chapter, text } = await req.json();

  const filename = `${storyId}_${chapter}.wav`;

  const audioRef = ref(storage, filename);

  let url: string | null = null

  try {
    url = await getDownloadURL(audioRef);
  } catch {}

  if (url) {
    return NextResponse.json({ audioUrl: url });
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });

  const input = {
    text,
    voice: "bf_emma",
  };

  const output: any = await replicate.run(
    "jaaari/kokoro-82m:dfdf537ba482b029e0a761699e6f55e9162cfd159270bfe0e44857caa5f275a6",
    { input }
  );

  await uploadString(audioRef, output as string);
  url = await getDownloadURL(audioRef);

  return NextResponse.json({ audioUrl: url });
}
