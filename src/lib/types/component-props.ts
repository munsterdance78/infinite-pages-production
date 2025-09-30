/**
 * Base component props and common interfaces
 */

import type { ReactNode } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

// Common UI component props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export interface CardProps extends BaseComponentProps {
  title?: string
  description?: string
  footer?: ReactNode
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface FormProps extends BaseComponentProps {
  onSubmit: (data: any) => void
  onCancel?: () => void
  isLoading?: boolean
}