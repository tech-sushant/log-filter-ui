import { FileUploadZone } from '../FileUploadZone'

export default function FileUploadZoneExample() {
  return (
    <FileUploadZone 
      onFileSelect={(content, filename) => {
        console.log('File selected:', filename, `${content.length} characters`)
      }} 
    />
  )
}
