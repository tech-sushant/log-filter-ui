import { ConfigPanel } from '../ConfigPanel'
import { useState } from 'react'

export default function ConfigPanelExample() {
  const [config, setConfig] = useState({
    enableResponseTruncation: true,
    enableStackCompression: true,
    enableSessionCompression: true,
    enableHTTPGrouping: true,
    enableContextAwareFiltering: true,
  })

  return (
    <ConfigPanel 
      config={config} 
      onChange={(newConfig) => {
        console.log('Config changed:', newConfig)
        setConfig(newConfig)
      }} 
    />
  )
}
