export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-900">
          Chef Rah&apos;s Twisted Kitchen
        </p>

        <p className="mt-2">
          Sunday delivery orders are due by Thursday at 5:00 PM. Late orders may
          include a $10 fee.
        </p>

        <div className="mt-4 flex gap-4">
          <a href="#" className="hover:text-black">
            Instagram
          </a>
          <a href="#" className="hover:text-black">
            Facebook
          </a>
          <a href="#" className="hover:text-black">
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}