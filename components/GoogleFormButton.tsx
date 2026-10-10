import Link from "next/link";

type Props = { href: string; label: string; fallback: string; fallbackHref?: string };
export default function GoogleFormButton({ href, label, fallback, fallbackHref = "/join" }: Props) {
  if (href) {
    return <a className="hero-btn hero-btn-red" href={href} target="_blank" rel="noreferrer">{label} ↗</a>;
  }
  return <Link className="hero-btn hero-btn-red" href={fallbackHref}>{fallback} →</Link>;
}
