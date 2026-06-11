import { useEffect } from 'react'

export default function Toast({ message, error, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, error ? 6000 : 3000)
    return () => clearTimeout(id)
  }, [message, error, onDismiss])

  return (
    <div className={`toast${error ? ' error' : ''}`} onClick={onDismiss}>
      {message}
    </div>
  )
}
