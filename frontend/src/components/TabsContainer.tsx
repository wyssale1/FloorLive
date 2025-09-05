import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

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
}

export default function TabsContainer({ 
  tabs, 
  defaultValue, 
  className = '',
  orientation = 'horizontal' 
}: TabsContainerProps) {
  const firstEnabledTab = tabs.find(tab => !tab.disabled)?.value
  const initialValue = defaultValue && !tabs.find(tab => tab.value === defaultValue)?.disabled 
    ? defaultValue 
    : firstEnabledTab

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={className}
    >
      <Tabs 
        defaultValue={initialValue} 
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