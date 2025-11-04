import { StatsDashboard } from '../StatsDashboard'

export default function StatsDashboardExample() {
  return (
    <StatsDashboard 
      originalLines={15247} 
      filteredLines={842} 
      processingTime={0.45}
    />
  )
}
