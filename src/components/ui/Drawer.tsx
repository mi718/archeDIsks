import { Fragment, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Drawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  side = 'right',
  size = 'md' 
}: DrawerProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-y-0 flex ${side === 'right' ? 'right-0' : 'left-0'} max-w-full`}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo={side === 'right' ? 'translate-x-full' : '-translate-x-full'}
              >
                <Dialog.Panel
                  className={`
                    pointer-events-auto w-screen
                    ${size === 'sm' && 'max-w-sm'}
                    ${size === 'md' && 'max-w-md'}
                    ${size === 'lg' && 'max-w-lg'}
                    ${size === 'xl' && 'max-w-xl'}
                  `}
                >
                  <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                        {title}
                      </Dialog.Title>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
