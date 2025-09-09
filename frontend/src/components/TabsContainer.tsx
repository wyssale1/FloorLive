import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

interface TabItem {
  value: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsContainerProps {
  tabs: TabItem[]
  defaultValue?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
  searchParamKey?: string // Key to use for search param, defaults to 'tab'
}

export default function TabsContainer({ 
  tabs, 
  defaultValue, 
  className = '',
  orientation = 'horizontal',
  searchParamKey = 'tab'
}: TabsContainerProps) {
  const router = useRouter()
  const search = useSearch({ from: '__root__' })
  
  // Get current tab from URL search params
  const currentTabFromUrl = (search as any)?.[searchParamKey] as string
  
  const firstEnabledTab = tabs.find(tab => !tab.disabled)?.value
  
  // Determine active tab: URL param > defaultValue > first enabled tab
  const getActiveTab = () => {
    if (currentTabFromUrl && !tabs.find(tab => tab.value === currentTabFromUrl)?.disabled) {
      return currentTabFromUrl
    }
    if (defaultValue && !tabs.find(tab => tab.value === defaultValue)?.disabled) {
      return defaultValue
    }
    return firstEnabledTab
  }
  
  const [activeTab, setActiveTab] = useState(getActiveTab())

  // Update active tab when URL changes
  useEffect(() => {
    const newActiveTab = getActiveTab()
    if (newActiveTab && newActiveTab !== activeTab) {
      setActiveTab(newActiveTab)
    }
  }, [currentTabFromUrl, defaultValue, tabs])

  // Handle tab change - update URL search params
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Update URL with new tab
    router.navigate({
      search: (prev: any) => ({
        ...prev,
        [searchParamKey]: value
      })
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={className}
    >
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
        orientation={orientation}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {tab.content}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  )
}