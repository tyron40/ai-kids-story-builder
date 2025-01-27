import { Input } from "@nextui-org/input";
import { Button, Image, useDisclosure } from "@nextui-org/react";
import React from "react";
import TakePhoto from "./TakePhoto";

function ImageInput({ userSelection }: any) {
  const [image, setImage] = React.useState<string | null>(null);
  const {
    isOpen: isTakePhotoOpen,
    onOpen: onTakePhotoOpen,
    onClose: onTakePhotoClose,
    onOpenChange: onTakePhotoOpenChange
  } = useDisclosure()

  const onFilePick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(URL.createObjectURL(file));
      userSelection({
        fieldName: "storyImage",
        fieldValue: file,
      });
    }
  };

  const onPhotoPick = (image: string) => {
    setImage(image)
    userSelection({
      fieldName: "storyImage",
      fieldValue: image,
    });
  }

  const onFileRemove = () => {
    setImage(null);
    userSelection({
      fieldName: "storyImage",
      fieldValue: null,
    });
  };

  return (
    <div>
      <label htmlFor="story-image" className="font-bold text-4xl text-primary">
        Your image (optional)
      </label>
      <div className="flex flex-col justify-between mt-3 gap-3">
        <Input
          id="story-image"
          type="file"
          accept="image/*"
          size="md"
          className="max-w-md"
          onChange={onFilePick}
        />
        <Button onPress={onTakePhotoOpen}>
          Take Photo
        </Button>
        {image && (
          <div className="relative flex justify-center items-center gap-2 max-h-[180px]">
            <Image src={image} className="max-h-[180px]"/>
            <Button
              color="primary"
              onPress={onFileRemove}
              className="absolute top-0 right-0 z-10"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
      <TakePhoto
        isOpen={isTakePhotoOpen}
        onClose={onTakePhotoClose}
        onOpenChange={onTakePhotoOpenChange}
        onPhotoPick={onPhotoPick}
      />
    </div>
  );
}

export default ImageInput;
