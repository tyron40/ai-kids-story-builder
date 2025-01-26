import { getTitle } from "@/app/_utils/storyUtils";
import { Page, Image, Text, View, Document } from "@react-pdf/renderer";
import { useMemo } from "react";
import { createTw } from "react-pdf-tailwind";

const tw = createTw({
  theme: {
    extend: {
      colors: {
        primary: "#5253A3",
      },
    },
  },
});

function Chapter({ chapter }: { chapter: any }) {
  return (
    <View style={tw("w-full flex justify-center items-center py-4")}>
      {chapter.chapter_image && (
        <Image
          src={chapter.chapter_image}
          style={{
            width: 300,
            height: 300,
            marginBottom: 24,
          }}
        />
      )}
      <Text style={tw("text-2xl font-bold text-primary flex justify-between")}>
        {chapter.chapter_title ?? ""}
      </Text>
      <Text
        style={tw("text-lg p-10 mt-3 rounded-lg bg-slate-100")}
      >
        {chapter.chapter_text ?? ""}
      </Text>
    </View>
  );
}

export default function StoryPDF({ story }: { story: any }) {
  const title = getTitle(story?.output);

  const chapters = useMemo(() => {
    if (!story?.output?.chapters) {
      return null;
    }

    return story.output.chapters.map((chapter: any, index: number) => {
      return <Chapter key={index} chapter={chapter} />;
    });
  }, [story]);

  return (
    <Document>
      <Page>
        <View>
          <Text
            style={tw(
              "font-bold text-4xl text-center p-10 pb-0 bg-primary text-white"
            )}
          >
            {title}
          </Text>
        </View>
        <View style={tw("w-full flex justify-center items-center")}>
          <Image src={story?.coverImage} style={{ width: 500, height: 500 }} />
        </View>
      </Page>
      {chapters.map((chapter: any, index: number) => (
        <Page key={index} style={tw("p-10")}>
          {chapter}
        </Page>
      ))}
    </Document>
  );
}
