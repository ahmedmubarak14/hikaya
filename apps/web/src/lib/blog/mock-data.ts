/**
 * Per-creator blog ("Journal") shapes. Mirrors the eventual Prisma `BlogPost`
 * model: bilingual title + body, optional cover image, free-form tags, and a
 * two-state lifecycle (DRAFT, PUBLISHED). Bodies are plain text with blank
 * lines separating paragraphs — no markdown library, no rich text. The PRD
 * keeps this surface intentionally lightweight so creators ship more often.
 */

export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogPost {
  id: string;
  /** CreatorProfile.id of the author. */
  creatorId: string;
  /** URL slug, unique per creator. */
  slug: string;
  titleEn: string;
  titleAr?: string;
  coverUrl?: string;
  /** Plain text; paragraphs separated by a blank line (\n\n). */
  bodyEn: string;
  bodyAr?: string;
  tags: string[];
  status: PostStatus;
  /** ISO timestamp set when first published. */
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------- seed --------------------------------- */

const pic = (seed: string, w: number, h: number): string =>
  `https://picsum.photos/seed/blog-${seed}/${w}/${h}`;

// Helpers to produce ISO timestamps a few days/weeks back so the seed feels
// natural without depending on the wall clock.
const daysAgo = (n: number): string => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'bp_noor_one_strobe',
    creatorId: 'cr_noor',
    slug: 'one-strobe-wedding-lighting',
    titleEn: 'How I light wedding ceremonies with one strobe',
    titleAr: 'كيف أُضيء حفلات الزفاف بـ"ستروب" واحد',
    coverUrl: pic('one-strobe', 1600, 900),
    bodyEn: [
      'Most wedding photographers I meet carry too much light. Two on stands, one off-camera, and a backup nobody knew was in the trunk. After seven years of shooting in Riyadh ballrooms, I shoot with one strobe and a small mod. It is faster, less invasive, and the pictures look closer to what the bride actually saw on her day.',
      'My setup is one Godox AD200 inside a 36" octa, mounted on a C-stand with a sandbag. The light goes camera-left at roughly 45 degrees, feathered toward the back of the room. That single move kills the flat, hotel-banquet look most ceremonies suffer from and replaces it with a soft directional wrap that flatters every skin tone, including the much darker grandmothers who tend to read as silhouettes under tungsten.',
      'I trigger with an XPro on top of the camera so I can dial power without leaving my position. For a Saudi ceremony in a typical Riyadh ballroom, I start at 1/8 power, ISO 800, f/2.8, 1/200s. I drop a third of a stop when the bride enters — her white dress is the brightest object in the frame and I want the highlights to fall just under clipping, not pinned to it.',
      'The hard part is not the light. It is the geometry. A ceremony moves: the procession, the readings, the rings, the kiss. The strobe has to live where it works for the longest single block of action — usually the readings — and I shoot the rest with available light or by ducking under the modifier for a quick on-axis pop. I never re-set during a ceremony. The sound of a C-stand wheel on marble is unforgivable.',
      'If you remember nothing else: one good light, placed deliberately, beats three bad ones placed anywhere. Buy a sandbag. Use it.',
    ].join('\n\n'),
    bodyAr: [
      'كثير من مصوّري الأعراس يحملون أكثر مما يلزم من الإضاءة. اثنان على حوامل، وواحد خارج الكاميرا، واحتياطي في السيارة لا يعرف أحدٌ به. بعد سبع سنين من التصوير في قاعات الرياض، صرتُ أُصوّر بستروب واحد ومُعدِّل صغير. أسرع، وأقلّ تطفّلاً، والصور أقرب لما رأته العروس فعلاً.',
      'تجهيزي: Godox AD200 داخل أوكتا 36 بوصة على حامل ثقيل مع كيس رمل. الضوء على يسار الكاميرا بزاوية ٤٥ درجة تقريباً، مُوجَّه نحو الجدار الخلفي للقاعة. هذه الحركة وحدها تقضي على المظهر المسطّح لقاعة الفنادق.',
      'أبدأ في حفلات الرياض بـ١/٨ من القوّة، ISO 800، فتحة 2.8، سرعة 1/200. أُنزل ثلث ستوب لحظة دخول العروس — فستانها الأبيض هو الأسطع في الإطار، وأريد للهايلايتس أن تبقى أسفل القصّ مباشرة.',
      'الجزء الصعب ليس الإضاءة. الجزء الصعب هو الهندسة. الحفل يتحرّك: الدخول، القراءات، تبادل الخواتم، القُبلة. الضوء يجب أن يُوضع حيث يخدم أطول مشهد متّصل — غالباً القراءات — وأُصوّر الباقي بضوء طبيعي.',
      'إن لم تتذكّر سوى شيء واحد: ضوء واحد جيّد، مُوضَع بنيّة، يهزم ثلاثة أضواء سيّئة موضوعة في أيّ مكان. اشترِ كيس رمل. واستخدمه.',
    ].join('\n\n'),
    tags: ['lighting', 'weddings', 'gear'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
  },
  {
    id: 'bp_noor_riyadh_season',
    creatorId: 'cr_noor',
    slug: 'five-lessons-riyadh-season-2025',
    titleEn: 'Five lessons from shooting Riyadh Season 2025',
    titleAr: 'خمسة دروس من تغطية موسم الرياض ٢٠٢٥',
    coverUrl: pic('riyadh-season', 1600, 900),
    bodyEn: [
      'I shot 14 days of Riyadh Season this year, across Boulevard, the Zone, and one private event at Diriyah. Three cameras, two photographers (I hired Sara, who is on this platform too), and roughly 38,000 frames culled to 2,400 delivered. Here are the lessons I carry forward.',
      'One — the brief is never the brief. Every brand who hired me asked for "candid energy" and then asked me to retake the staged hero shot four times. Plan for both. I now build a 30-minute hero block into every Season call sheet so the client gets the safe photograph early and I can spend the rest of the night being useful.',
      'Two — manage your dust. Boulevard kicks up an astonishing amount of it after 10 p.m. I lost two days of frames last year to sensor specks. This year I cleaned bodies every morning and ran a clone-stamp action across every export. Different problem, but plan for it.',
      'Three — Arabic captions matter more than English ones. Almost every client requested Arabic-first social cuts. If you do not have a reliable Arabic copywriter, find one before December. I work with Reem; she charges 200 SAR per cut and the brands love her.',
      'Four — the talent does not want your direction. Every influencer I shot already had three poses they wanted in the frame. I gave up trying to redirect by year two of Season. Now I shoot what they bring, then ask for "one more for me" and that is where the editorial work happens.',
      'Five — do not over-edit. The Season look is warm, slightly grainy, contrasty in the shadows but never crushed. I built a preset for it (in the store) and used it on every photograph from the run. The brands who hired me specifically said the consistency across deliverables was the thing that earned them the renewal.',
    ].join('\n\n'),
    bodyAr: [
      'صوَّرت ١٤ يوماً من موسم الرياض هذا العام، في البوليفارد والـZone وحدث خاص في الدرعيّة. ثلاث كاميرات ومصوّرتان (وظّفت سارة، الموجودة على هذه المنصّة)، وحوالى ٣٨٠٠٠ إطار اختير منها ٢٤٠٠ للتسليم. هذه الدروس التي أحملها معي.',
      'أوّلاً — البريف ليس البريف. كلّ علامة تجاريّة طلبت "طاقة عفويّة" ثمّ طلبت إعادة اللقطة البطلة المُجهّزة أربع مرّات. خطّط للأمرين. صرت أُدرج بلوك "هيرو" مدّته ٣٠ دقيقة في كلّ جدول تصوير.',
      'ثانياً — احرص على الغبار. البوليفارد بعد العاشرة مساءً يثير كميّة مذهلة منه. خسرت يومين من اللقطات السنة الماضية بسبب الحسّاس. هذا العام نظّفت الكاميرات كلّ صباح ودشّنت أكشن إزالة شوائب على كلّ إكسبورت.',
      'ثالثاً — التعليقات بالعربيّة تهمّ أكثر من الإنجليزيّة. غالبية العملاء طلبوا قِصص سوشال بالعربيّة أوّلاً. لو ليس لديك كاتب موثوق، ابحث عن واحد قبل ديسمبر.',
      'رابعاً — لا يريد التالينت توجيهاتك. كلّ مؤثّر صوّرته كانت لديه ثلاث وضعيّات يريدها في الإطار. تركت محاولة إعادة التوجيه من السنة الثانية للموسم.',
      'خامساً — لا تُبالغ في المعالجة. مظهر الموسم دافئ، فيه حبيبات خفيفة، وكنتراست في الظلال دون سحقها. بنيت بريسِت لذلك (في المتجر) واستخدمتُه في كلّ صورة.',
    ].join('\n\n'),
    tags: ['riyadh-season', 'events', 'workflow'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(18),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
  },
  {
    id: 'bp_noor_color_grading',
    creatorId: 'cr_noor',
    slug: 'my-color-grading-workflow-lightroom',
    titleEn: 'My color grading workflow in Lightroom',
    titleAr: 'سير عملي في تدرّج الألوان داخل Lightroom',
    coverUrl: pic('color-grading', 1600, 900),
    bodyEn: [
      'I keep getting asked how I get a consistent grade across a wedding without spending six hours in front of the screen. The answer is unsexy: it is a fixed sequence applied to every photograph, and a strict rule against breaking the sequence until the last 5%.',
      'I shoot in flat picture style on the Sony A7IV — neutral with -3 contrast and -2 saturation in-camera. The reasons are unromantic: it lets the histogram tell the truth, it makes the back-of-camera review less misleading for clients peeking over my shoulder, and most importantly it gives my preset something predictable to work against.',
      'Import goes through Photo Mechanic for culling. I never cull inside Lightroom; it is too slow, and the previews lie to me. Once I have my selects, I batch-apply my base preset (the warm one in my store) before I open a single image. That preset does the heavy lifting — white balance shift toward 5400K, +12 vibrance, -8 saturation on the yellow channel to keep skin clean, and a subtle S-curve.',
      'Per-image work is then only three things: exposure correction, a crop, and if the subject is dark-skinned I lift the orange luminance by +5 to +8. That is it. If I find myself reaching for the HSL panel mid-edit, I know I have chosen the wrong base preset, and I revert.',
      'Export at 3000px on the long edge, sRGB, 80% quality. JPEGs only — clients never asked for TIFFs in seven years. The full set goes through one round of QA: scroll through at 100% on the second monitor, fix the three or four photographs that drifted, and ship.',
    ].join('\n\n'),
    bodyAr: [
      'يسألني الناس كثيراً كيف أحصل على تدرّج لون متّسق في عرس كامل دون قضاء ست ساعات أمام الشاشة. الجواب غير مثير: تسلسل ثابت يُطبَّق على كلّ صورة، وقاعدة صارمة بعدم كسره حتى آخر ٥٪.',
      'أصوّر بستايل صورة مسطّح على Sony A7IV — محايد بـ-3 كونتراست و-2 إشباع داخل الكاميرا. السبب غير رومانسي: يجعل الهيستوغرام صادقاً، ويجعل مراجعة الشاشة الخلفيّة أقلّ تضليلاً للعميل، ويعطي البريسِت شيئاً يمكنه التنبّؤ به.',
      'الاستيراد عبر Photo Mechanic للفرز. لا أفرز داخل Lightroom أبداً؛ بطيء جدّاً والمعاينات تكذب. حالما أحصل على الاختيارات، أُطبّق البريسِت الأساسي (الدافئ في المتجر) دفعة واحدة قبل أن أفتح أيّ صورة.',
      'العمل لكلّ صورة بعد ذلك ثلاثة فقط: تصحيح التعرّض، اقتصاص، ورفع لومينانس البرتقالي بـ+5 إلى +8 إن كانت بشرة الموضوع داكنة. هذا كلّ شيء.',
      'الإكسبورت ٣٠٠٠ بكسل للحافة الطويلة، sRGB، جودة ٨٠٪. JPEG فقط — لم يطلب عميل TIFF خلال سبع سنوات.',
    ].join('\n\n'),
    tags: ['color', 'lightroom', 'workflow'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(35),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(35),
  },
  {
    id: 'bp_noor_saudi_brides_draft',
    creatorId: 'cr_noor',
    slug: 'working-with-saudi-brides-cultural-notes',
    titleEn: 'Working with Saudi brides: cultural notes for new photographers',
    titleAr: 'العمل مع العرائس السعوديّات: ملاحظات ثقافيّة للمصوّرين الجدد',
    bodyEn: [
      'A draft I have been sitting on. Posting this once a few friends have read it. The short version is that the standard wedding-photography playbook — Pinterest poses, golden-hour first look, casual second-shooter banter — does not translate cleanly to a Saudi ceremony, and pretending it does makes for tense days and lukewarm work.',
      'The biggest single shift is that the bride is on display for the first time in front of women who have never seen her without abaya, and on display in a setting where every guest is documenting her with their own phone. She is not relaxed. She is not "casually candid." Asking her to laugh into the middle distance does not work; she is not going to. Build your work around that fact.',
      'I will fill this out — sections on second shooters (mixed-gender teams in conservative venues), gift portrait sessions for the family-only portion, the timeline negotiation with the wedding planner, and the unwritten rule about not photographing aunts in the wide shots. Coming back to it next week.',
    ].join('\n\n'),
    bodyAr: [
      'مسوّدة أحتفظ بها منذ مدّة. سأنشرها بعد أن يقرأها بعض الأصدقاء. الخلاصة أنّ كتاب قواعد تصوير الأعراس الغربي — وضعيّات Pinterest، الـfirst look في الساعة الذهبيّة، الدردشة العفويّة مع المساعد — لا يترجم بسلاسة لحفل سعودي.',
      'التحوّل الأكبر هو أنّ العروس تُعرض للمرّة الأولى أمام نساء لم يرينها بدون عباءة، في موقع يوثّقها فيه كلّ ضيف بهاتفه. هي ليست مسترخية. هي ليست "عفويّة بهدوء". اطلب منها الضحك للأفق ولن تفعل. ابنِ عملك على هذه الحقيقة.',
      'سأكمل النصّ — أقسام عن المساعدين (الفِرَق المختلطة في المواقع المحافِظة)، جلسة بورتريه للعائلة فقط، التفاوض مع منظّمة العرس على الجدول، والقاعدة غير المكتوبة بعدم تصوير الخالات في اللقطات العريضة. سأعود إليها الأسبوع القادم.',
    ].join('\n\n'),
    tags: ['weddings', 'culture', 'process'],
    status: 'DRAFT',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];
