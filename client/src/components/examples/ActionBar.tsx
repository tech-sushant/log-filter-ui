import { ActionBar } from '../ActionBar'

export default function ActionBarExample() {
  return (
    <ActionBar 
      onDownload={() => console.log('Download clicked')}
      onCopy={() => console.log('Copy clicked')}
      onReset={() => console.log('Reset clicked')}
      onSearch={(query) => console.log('Search:', query)}
    />
  )
}
