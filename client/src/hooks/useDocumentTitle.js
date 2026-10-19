import { useEffect } from 'react'

export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return
    const anterior = document.title
    document.title = title
    return () => { document.title = anterior }
  }, [title])
}
