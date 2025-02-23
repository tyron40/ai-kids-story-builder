export interface FieldData {
  fieldName: string
  fieldValue: string | File | null
}

export interface FormDataType {
  storySubject: string
  storyImage: File | string | null
  storyType: string
  imageStyle: string
  ageGroup: string
  totalChapters: number
}

export type UserSelectionHandler = (data: FieldData) => void

export interface OptionField {
  label: string
  imageUrl: string
  isFree: boolean
}
