import { useDecrypt } from '../lib/useDecrypt'

// Inline text that scrambles → resolves on hover/focus. Drop-in for headings.
export default function DecryptText({ text, className, ...rest }) {
  const { display, bind } = useDecrypt(text)
  return (
    <span className={className} {...bind} {...rest}>
      {display}
    </span>
  )
}
