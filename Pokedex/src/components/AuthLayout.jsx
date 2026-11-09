import { Link } from "react-router-dom";

function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <section className="relative isolate min-h-[calc(100vh-90px)] overflow-hidden bg-[#fff9fc] px-4 py-10 sm:px-6 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-rose-200/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-violet-100/80 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[30px] border border-white bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur-sm lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#ffe6ec] via-[#fff1f3] to-[#ecebff] p-8 sm:p-10 lg:min-h-[580px]">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border-[35px] border-white/50" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 rounded-full border-[30px] border-white/50" />
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-red-500 shadow-sm">◉</span>
              PokémonHub
            </Link>
            <span className="mt-14 block text-xs font-extrabold uppercase tracking-[0.18em] text-red-500">Your Pokémon journey</span>
            <h2 className="mt-4 max-w-sm text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">Your adventure starts here.</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">สำรวจโลก Pokémon ค้นหาตัวโปรด และเตรียมสร้างคอลเลกชันของคุณใน PokémonHub</p>
          </div>
          <div className="relative mt-10 flex items-center gap-3 rounded-2xl bg-white/60 p-4 text-sm text-slate-600 backdrop-blur-sm">
            <span className="text-2xl" aria-hidden="true">✦</span>
            <span>Discover • Collect • Explore</span>
          </div>
        </aside>

        <div className="flex flex-col justify-center p-7 sm:p-10 lg:px-14">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-500">{eyebrow}</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-7 border-t border-slate-100 pt-6 text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </section>
  );
}

export default AuthLayout;
