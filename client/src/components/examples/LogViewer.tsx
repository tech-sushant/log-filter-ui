import { LogViewer } from '../LogViewer'

const sampleLogs = `2024-01-15 10:23:45:123 - [HTTP] [HTTP] --> POST /session
2024-01-15 10:23:45:234 - [HTTP] [HTTP] <-- POST /session 200 1245ms
2024-01-15 10:23:46:345 - [debug] Executing command 'findElement'
2024-01-15 10:23:46:456 - [HTTP] [HTTP] --> POST /element
2024-01-15 10:23:46:567 - [HTTP] [HTTP] <-- POST /element 404 89ms
2024-01-15 10:23:46:678 - [WARNING] Element not found with selector
2024-01-15 10:23:46:789 - [Error] NoSuchElementException: Unable to find element`;

export default function LogViewerExample() {
  return (
    <div className="h-96">
      <LogViewer 
        title="Example Logs" 
        content={sampleLogs} 
        lineCount={7}
        testId="viewer-example"
      />
    </div>
  )
}
