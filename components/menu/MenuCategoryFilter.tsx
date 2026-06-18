"use client";

type Props = {
  categories: string[];
};

export function MenuCategoryFilter({ categories }: Props) {
  function scrollToCategory(category: string) {
    const id = category.toLowerCase().replace(/\s+/g, "-");
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <div className="sticky top-[88px] z-40 mb-10 border-y border-[#ead8c1] bg-[#fff8ee]/92 py-3 backdrop-blur-xl">
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => scrollToCategory(category)}
            className="shrink-0 rounded-full border border-[#ead8c1] bg-white px-4 py-2 text-sm font-bold text-[#3b241b] shadow-sm transition hover:-translate-y-0.5 hover:border-[#d99426] hover:text-[#9f2f18]"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
