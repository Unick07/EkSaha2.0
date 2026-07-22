import { Button } from "../../components/common/ui";

export default function NotFound() {
  return <section className="grid min-h-[70vh] place-items-center text-center"><div><div className="text-8xl font-extrabold text-blue-100 dark:text-white/10">404</div><h1 className="mt-[-25px] text-3xl font-bold">This page took a wrong turn.</h1><p className="mt-4 text-slate-500">The link may be old, but your next step doesn’t have to be.</p><Button to="/" className="mt-7">Back home</Button></div></section>;
}
