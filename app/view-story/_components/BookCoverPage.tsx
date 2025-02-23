import Image from "next/image"
import { ForwardedRef, forwardRef } from "react"

interface BookCoverPageProps {
  imageUrl: string
}

const BookCoverPage = forwardRef(
  (props: BookCoverPageProps, ref: ForwardedRef<HTMLDivElement>) => {
    return (
      <div ref={ref}>
        <Image src={props.imageUrl} alt="cover" width={500} height={500} />
      </div>
    )
  }
)

BookCoverPage.displayName = "BookCoverPage"

export default BookCoverPage
