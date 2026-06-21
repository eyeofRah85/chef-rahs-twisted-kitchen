export function SiteFooter() {
  return (
    <footer className="border-t border-[#ead8c1] bg-[#24130f] text-[#fff8ee]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">Chef Rah&apos;s Twisted Kitchen</p>

          <p className="mt-3 max-w-md leading-6 text-[#f3dcc4]">
            Chef-prepared weekly meals, catering, and personal chef service with
            bold flavor and practical ordering support.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Order Notes</p>
          <p className="mt-3 leading-6 text-[#f3dcc4]">
            Sunday delivery orders are due by Thursday at 5:00 PM. Late orders
            may include a $10 fee.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Connect</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="#" className="transition hover:text-[#f4c46f]">
              Instagram
            </a>
            <a href="#" className="transition hover:text-[#f4c46f]">
              Facebook
            </a>
            <a href="#" className="transition hover:text-[#f4c46f]">
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
