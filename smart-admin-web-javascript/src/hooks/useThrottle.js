import { ref } from "vue"

function useThrottle(callback, delay = 100) {
  let timer = null
  let isThrottled = ref(false)

  const throttledCallback = () => {
    if (!isThrottled.value) {
      callback()
      isThrottled.value = true
      timer = setTimeout(() => {
        isThrottled.value = false
      }, delay)
    }
  }
  // 节流响应"resize"事件
  window.addEventListener("resize", throttledCallback)

  return {
    destroy() {
      window.removeEventListener("resize", throttledCallback)
      clearTimeout(timer)
    },
  }
}

export default useThrottle
