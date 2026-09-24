import type {
  ActContent,
  CodaContent,
  NotFoundContent,
  ObjectContent,
  OpeningContent,
} from "@/types/content";

/**
 * The copy deck — the whole page, about 150 words.
 *
 * Written at the altitude of a fragrance house: each sentence is a sensation and
 * a material, never a benefit and never a buyer. No second person, and no
 * imperative except the one call to action.
 *
 * The note names are invented components of a fictional composition. What is
 * not here, and must never be added: anything about skin, any safety or allergy
 * claim, a longevity or projection figure, a certification, a named house,
 * perfumer or supplier, or a real origin tied to a real place.
 *
 * Every image is a placeholder at the exact path and ratio of the photograph
 * that replaces it, so the real set is a file swap with no edit here.
 */

const LANDSCAPE = { width: 1536, height: 1024 };
const SQUARE = { width: 1024, height: 1024 };

export const opening: OpeningContent = {
  line: "پیش از آنکه دیده شود، در هوا هست.",
  image: { src: "/media/t-01.jpg", ...SQUARE },
};

/** Three records, one component. The order here is the order of the descent. */
export const acts: readonly ActContent[] = [
  {
    tier: "open",
    order: 1,
    name: "نت آغازین",
    notes: ["پوست ترنج", "برگ انجیر", "زنجبیل تازه"],
    sentence: "نخستین لحظه سرد و روشن است؛ تلخی پوست ترنج و سبزی برگی که تازه بریده شده.",
    image: { src: "/media/n-01.jpg", ...LANDSCAPE },
  },
  {
    tier: "heart",
    order: 2,
    name: "نت میانی",
    notes: ["گلبرگ رز", "یاس سفید", "زعفران"],
    sentence:
      "گرما آهسته از راه می‌رسد؛ گلبرگ‌هایی که زیر نوری نرم باز می‌شوند و ته‌رنگی از زعفران.",
    image: { src: "/media/n-02.jpg", ...LANDSCAPE },
  },
  {
    tier: "base",
    order: 3,
    name: "نت پایه",
    notes: ["صمغ کندر", "چوب عود", "کهربا"],
    sentence:
      "آنچه در پایان می‌ماند تیره و گرم است؛ صمغی که آهسته دود می‌شود و چوبی کهنه، زیر نوری کم.",
    image: { src: "/media/n-03.jpg", ...LANDSCAPE },
  },
];

export const object: ObjectContent = {
  name: "شمیم",
  latin: "SHAMIM",
  coda: ["سه لحظه، در یک شیشه.", "از سرمای صبح تا گرمای چوب، در یک نفس."],
  image: { src: "/media/t-02.jpg", ...SQUARE },
};

export const coda: CodaContent = {
  sentence: "روز عرضه هنوز اعلام نشده است؛ نخستین خبرش با یک پیام می‌رسد.",
  heading: "اطلاع از عرضه",
  phoneLabel: "تلفن",
  whatsappLabel: "واتس‌اپ",
  whatsappMessage: "سلام؛ لطفاً روز عرضه شمیم را خبر بدهید.",
};

export const notFound: NotFoundContent = {
  heading: "این نشانی وجود ندارد",
  lead: "شمیم تنها یک صفحه دارد و آن صفحه اینجا نیست.",
  action: { label: "بازگشت به شمیم", href: "/" },
};
