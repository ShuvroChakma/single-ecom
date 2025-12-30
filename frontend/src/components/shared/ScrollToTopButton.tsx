import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300)
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed bottom-13 right-0.5 z-999
        w-8 h-8 rounded-full
        border border-header text-header
        flex items-center justify-center
        shadow-lg hover:opacity-90 hover:
        transition
      "
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}

export default ScrollToTopButton
